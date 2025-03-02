import { Module } from '@nestjs/common';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { TransportModule } from './transport/transport.module';

@Module({
  imports: [OrdersModule, PrismaModule, TransportModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
