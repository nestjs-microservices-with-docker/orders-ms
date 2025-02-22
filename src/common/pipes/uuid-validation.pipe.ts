import { BadRequestException, Injectable, ParseIntPipe, ParseUUIDPipe } from '@nestjs/common';

@Injectable()
export class 
UuidValidationPipe extends ParseUUIDPipe {
  constructor(){
    super({
      exceptionFactory: () => new BadRequestException('Id must be type uuid')
    })
  }
}