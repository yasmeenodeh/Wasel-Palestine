import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RoleHeaderGuard } from '../../common/guards/role-header.guard';
import { CheckpointsService } from './application/checkpoints.service';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';
import { CreateCheckpointStatusHistoryDto } from './dto/create-checkpoint-status-history.dto';
import { ListCheckpointsDto } from './dto/list-checkpoints.dto';
import { UpdateCheckpointDto } from './dto/update-checkpoint.dto';

type RequestWithUser = {
  user?: {
    id: number;
  };
};

@Controller({ path: 'checkpoints', version: '1' })
export class CheckpointsController {
  constructor(private readonly checkpointsService: CheckpointsService) {}

  @Get()
  list(@Query() query: ListCheckpointsDto) {
    return this.checkpointsService.list(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.checkpointsService.findOne(id.toString());
  }

  @Post()
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  create(@Body() dto: CreateCheckpointDto, @Req() req: RequestWithUser) {
    return this.checkpointsService.create(dto, req.user?.id);
  }

  @Patch(':id')
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCheckpointDto,
    @Req() req: RequestWithUser,
  ) {
    return this.checkpointsService.update(id.toString(), dto, req.user?.id);
  }

  @Get(':id/status-history')
  getStatusHistory(@Param('id', ParseIntPipe) id: number) {
    return this.checkpointsService.getStatusHistory(id.toString());
  }

  @Post(':id/status-history')
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  addStatusHistory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCheckpointStatusHistoryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.checkpointsService.addStatusHistory(id.toString(), dto, req.user?.id);
  }
}
