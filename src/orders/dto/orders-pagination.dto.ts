import { IsEnum, IsOptional } from "class-validator";
import { OrderStatus } from "@prisma/client";
import { PaginationDto } from "@common/dto";
import { OrderStatusList } from "../enum/order-status.enum";

export class OrdersPaginatinDto extends PaginationDto {
  @IsOptional()
  @IsEnum(OrderStatusList, {
    message: `Status must be one of ${OrderStatusList.join(', ')}`
  })
  status: OrderStatus
}