import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RoleHeaderGuard } from '../../common/guards/role-header.guard';
import { CloseIncidentDto } from './dto/close-incident.dto';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { ListIncidentsDto } from './dto/list-incidents.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { VerifyIncidentDto } from './dto/verify-incident.dto';
import { IncidentsService } from './incidents.service';

type RequestWithUser = {
  user?: {
    id: number;
  };
};

@Controller({ path: 'incidents', version: '1' })
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  list(@Query() query: ListIncidentsDto) {
    return this.incidentsService.list(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.incidentsService.findOne(id.toString());
  }

  @Post()
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  create(@Body() dto: CreateIncidentDto, @Req() req: RequestWithUser) {
    return this.incidentsService.create(dto, req.user?.id ?? 0);
  }

  @Patch(':id')
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIncidentDto) {
    return this.incidentsService.update(id.toString(), dto);
  }

  @Post(':id/verify')
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  verify(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VerifyIncidentDto,
    @Req() req: RequestWithUser,
  ) {
    return this.incidentsService.verify(id.toString(), dto, req.user?.id ?? 0);
  }

  @Post(':id/close')
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  close(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CloseIncidentDto,
    @Req() req: RequestWithUser,
  ) {
    return this.incidentsService.close(id.toString(), dto, req.user?.id ?? 0);
  }

  @Get(':id/status-history')
  getStatusHistory(@Param('id', ParseIntPipe) id: number) {
    return this.incidentsService.getStatusHistory(id.toString());
  }
}
