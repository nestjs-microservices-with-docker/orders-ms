import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { IdValidationPipe, UuidValidationPipe } from 'src/common/pipes';
import { OrdersPaginatinDto } from './dto/orders-pagination.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern({ cmd: 'create_order' })
  create(@Payload() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @MessagePattern({ cmd: 'find_all_orders' })
  findAll(@Payload() ordersPaginatinDto: OrdersPaginatinDto) {
    return this.ordersService.findAll(ordersPaginatinDto);
  }

  @MessagePattern({ cmd: 'find_one_order' })
  findOne(@Payload('id', UuidValidationPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @MessagePattern({ cmd: 'update_order_status' })
  updateStatus(@Payload() updateStatusDto: UpdateStatusDto) {
    return this.ordersService.updateStatus(updateStatusDto);
  }
}
