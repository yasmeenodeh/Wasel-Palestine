import { Controller, Get } from '@nestjs/common';
import { ReferenceDataService } from './application/reference-data.service';

@Controller({ path: 'reference-data', version: '1' })
export class ReferenceDataController {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  @Get('incident-categories')
  listIncidentCategories() {
    return this.referenceDataService.listIncidentCategories();
  }

  @Get('incident-severities')
  listIncidentSeverities() {
    return this.referenceDataService.listIncidentSeverities();
  }

  @Get('incident-statuses')
  listIncidentStatuses() {
    return this.referenceDataService.listIncidentStatuses();
  }

  @Get('roles')
  listRoles() {
    return this.referenceDataService.listRoles();
  }
}
