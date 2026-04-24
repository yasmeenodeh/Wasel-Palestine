import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RoleHeaderGuard } from '../../common/guards/role-header.guard';
import { RequestUser } from '../../common/types/request-user.type';
import { ReportsService } from './application/reports.service';
import { ApproveReportDto } from './dto/approve-report.dto';
import { AttachReportImageDto } from './dto/attach-report-image.dto';
import { ConvertReportDto } from './dto/convert-report.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { FlagReportAbuseDto } from './dto/flag-report-abuse.dto';
import { ListReportsDto } from './dto/list-reports.dto';
import { ListTopContributorsDto } from './dto/list-top-contributors.dto';
import { MergeReportDto } from './dto/merge-report.dto';
import { RejectReportDto } from './dto/reject-report.dto';
import { VoteReportDto } from './dto/vote-report.dto';

type RequestWithUser = {
  user?: RequestUser;
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

  @Get('top-contributors')
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CITIZEN)
  topContributors(@Query() query: ListTopContributorsDto) {
    return this.reportsService.getTopContributors(query.limit);
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

  @Get(':id/images')
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CITIZEN)
  getImages(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.getImages(id.toString());
  }

  @Post(':id/images')
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CITIZEN)
  attachImage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AttachReportImageDto,
    @Req() req: RequestWithUser,
  ) {
    return this.reportsService.attachImage(id.toString(), dto, req.user?.id ?? 0);
  }

  @Delete(':reportId/images/:imageId')
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CITIZEN)
  deleteImage(
    @Param('reportId', ParseIntPipe) reportId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @Req() req: RequestWithUser,
  ) {
    return this.reportsService.deleteImage(
      reportId.toString(),
      imageId.toString(),
      req.user?.id ?? 0,
      req.user?.role ?? UserRole.CITIZEN,
    );
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

  @Post(':id/flag-abuse')
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  flagAbuse(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: FlagReportAbuseDto,
    @Req() req: RequestWithUser,
  ) {
    return this.reportsService.flagAbuse(id.toString(), dto, req.user?.id ?? 0);
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

  @Delete(':id')
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CITIZEN)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.reportsService.remove(
      id.toString(),
      req.user?.id ?? 0,
      req.user?.role ?? UserRole.CITIZEN,
    );
  }
}
