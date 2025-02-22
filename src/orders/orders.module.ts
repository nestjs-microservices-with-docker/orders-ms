import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { envs, PRODUCTS_MICROSERVICE } from '../config';

@Module({
  imports: [
    PrismaModule,
    ClientsModule.register([
      {
        name: PRODUCTS_MICROSERVICE,
        transport: Transport.TCP,
        options: {
          host: envs.productsMicroserviceHost,
          port: envs.productsMicroservicePort
        }
      }
    ])
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
