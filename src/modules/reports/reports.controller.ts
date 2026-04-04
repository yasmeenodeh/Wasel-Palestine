import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RoleHeaderGuard } from '../../common/guards/role-header.guard';
import { ApproveReportDto } from './dto/approve-report.dto';
import { ConvertReportDto } from './dto/convert-report.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { ListReportsDto } from './dto/list-reports.dto';
import { MergeReportDto } from './dto/merge-report.dto';
import { RejectReportDto } from './dto/reject-report.dto';
import { VoteReportDto } from './dto/vote-report.dto';
import { ReportsService } from './reports.service';

type RequestWithUser = {
  user?: {
    id: number;
  };
};

@Controller({ path: 'reports', version: '1' })
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CITIZEN)
  list(@Query() query: ListReportsDto) {
    return this.reportsService.list(query);
  }

  @Get(':id')
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CITIZEN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.findOne(id.toString());
  }

  @Post()
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CITIZEN)
  create(@Body() dto: CreateReportDto, @Req() req: RequestWithUser) {
    return this.reportsService.create(dto, req.user?.id ?? 0);
  }

  @Post(':id/votes')
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CITIZEN)
  vote(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VoteReportDto,
    @Req() req: RequestWithUser,
  ) {
    return this.reportsService.vote(id.toString(), dto, req.user?.id ?? 0);
  }

  @Get(':id/votes')
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  getVotes(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.getVotes(id.toString());
  }

  @Get(':id/moderation-actions')
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  getModerationActions(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.getModerationActions(id.toString());
  }

  @Post(':id/approve')
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveReportDto,
    @Req() req: RequestWithUser,
  ) {
    return this.reportsService.approve(id.toString(), dto, req.user?.id ?? 0);
  }

  @Post(':id/reject')
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectReportDto,
    @Req() req: RequestWithUser,
  ) {
    return this.reportsService.reject(id.toString(), dto, req.user?.id ?? 0);
  }

  @Post(':id/merge')
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  merge(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MergeReportDto,
    @Req() req: RequestWithUser,
  ) {
    return this.reportsService.merge(id.toString(), dto, req.user?.id ?? 0);
  }

  @Post(':id/convert-to-incident')
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  convertToIncident(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConvertReportDto,
    @Req() req: RequestWithUser,
  ) {
    return this.reportsService.convertToIncident(id.toString(), dto, req.user?.id ?? 0);
  }
}
