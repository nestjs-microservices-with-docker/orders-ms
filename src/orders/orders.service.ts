import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersPaginatinDto } from './dto/orders-pagination.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Product } from './entities';
import { NATS_SERVICE, PRODUCTS_MICROSERVICE } from '../config';
import { OrderWithProducts } from './interfaces/order-w-products.interface';
import { PaidOrderDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(NATS_SERVICE) private readonly client: ClientProxy
  ){}

  async create(createOrderDto: CreateOrderDto) {
    try {
      const productIds = createOrderDto.items.map(item => item.productId)
      
      // 1. Validate products
      const products: Product[] = await firstValueFrom(this.client.send({ cmd: 'validate_products' }, productIds))
      
      // 2. Calculate total amount and total items
      const totalAmount = products.reduce((acc, item) => acc + item.price, 0)      // const order = await this.prisma.order.create({
        //   data: {
          //     totalAmount: 
          //   }
          // })
      const totalItems = createOrderDto.items.reduce((acc, item) => acc + item.quantity, 0)

      // 3. Create order by a transaction in database

      const order = await this.prisma.order.create({
        data: {
          totalAmount,
          totalItems,
          OrderItems: {
            createMany: {
              data: createOrderDto.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: products.find(productItem => productItem.id === item.productId).price
              }))
            }
          }
        },
        include: {
          OrderItems: {
            select: {
              price: true,
              quantity: true,
              productId: true
            }
          }
        }
      })
      return {
        ...order,
        OrderItems: order.OrderItems.map(item => ({
          ...item,
          name: products.find(productItem => productItem.id === item.productId).name
        }))
      }
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Something went wrong while validating products'
      })
    }
    
  }

  async findAll(ordersPaginatinDto: OrdersPaginatinDto) {
    const { status, limit, page } = ordersPaginatinDto

    const total = await this.prisma.order.count({
      where: {
        status
      }
    })

    const lastPage = Math.ceil(total / limit)

    const data = await this.prisma.order.findMany({
      take: limit,
      skip: (page - 1) * limit,
      where: {
        status
      }
    })

    return {
      data,
      meta: {
        page,
        total,
        lastPage
      }
    }
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: {
        id
      },
      include: {
        OrderItems: {
          select: {
            price: true,
            quantity: true,
            productId: true
          }
        }
      }
    })

    if(!order) {
      throw new RpcException({
        message: `Order with id #${id} not found`,
        status: HttpStatus.NOT_FOUND
      })
    }

    const products: Product[] = await firstValueFrom(this.client.send({ cmd: 'validate_products' }, order.OrderItems.map(item => item.productId)))



    return {
      ...order,
      OrderItems: order.OrderItems.map(item => ({
        ...item,
        name: products.find(productItem => productItem.id === item.productId).name
      }))
    }
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  async updateStatus(updateStatusDto: UpdateStatusDto) {
    const order = await this.findOne(updateStatusDto.id)

    if(order.status === updateStatusDto.status) {
      return order
    }

    return this.prisma.order.update({
      where: {
        id: updateStatusDto.id
      },
      data: {
        status: updateStatusDto.status
      }
    })
  }

  async createPaymentSession(order: OrderWithProducts) {
    const paymentSession = await firstValueFrom(this.client.send({
      cmd: 'create.payment.session',
    }, {
      orderId: order.id,
      currency: 'usd',
      items: order.OrderItems.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }))
    }));

    // console.log({ paymentSession });
    return paymentSession
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
  async paidOrder(paidOrderDto: PaidOrderDto) {
    
    const { orderId, receiptUrl, stripePaymentId } = paidOrderDto

    const order = await this.prisma.order.update({
      where: {
        id: orderId
      },
      data: {
        status: 'PAID',
        paid: true,
        paidAt: new Date(),
        stripeChargeId: stripePaymentId, 

        OrderReceipt: {
          create: {
            receiptUrl
          },
        },
      },
    });
    return order;
  }
}
