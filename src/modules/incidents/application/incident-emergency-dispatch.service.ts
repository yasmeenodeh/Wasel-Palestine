import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationService } from '../../../common/domain/location.service';
import { EmergencyServiceCenterEntity } from '../../../database/entities/emergency-service-center.entity';
import { IncidentEmergencyDispatchEntity } from '../../../database/entities/incident-emergency-dispatch.entity';
import { IncidentEntity } from '../../../database/entities/incident.entity';
import { EmergencyDispatchPolicyService } from '../domain/emergency-dispatch-policy.service';

@Injectable()
export class IncidentEmergencyDispatchService {
  constructor(
    @InjectRepository(IncidentEntity)
    private readonly incidentRepository: Repository<IncidentEntity>,
    @InjectRepository(EmergencyServiceCenterEntity)
    private readonly emergencyServiceCenterRepository: Repository<EmergencyServiceCenterEntity>,
    @InjectRepository(IncidentEmergencyDispatchEntity)
    private readonly incidentEmergencyDispatchRepository: Repository<IncidentEmergencyDispatchEntity>,
    private readonly emergencyDispatchPolicyService: EmergencyDispatchPolicyService,
    private readonly locationService: LocationService,
  ) {}

  async syncForIncident(incidentId: string) {
    const incident = await this.incidentRepository.findOne({
      where: { id: incidentId },
      relations: {
        category: true,
      },
    });

    if (!incident) {
      throw new NotFoundException(`Incident ${incidentId} was not found.`);
    }

    const shouldDispatch = this.emergencyDispatchPolicyService.shouldDispatch({
      categoryName: incident.category?.name,
      title: incident.title,
      description: incident.description,
    });

    const existingDispatches = await this.incidentEmergencyDispatchRepository.find({
      where: { incidentId },
    });

    if (!shouldDispatch) {
      if (existingDispatches.length > 0) {
        await this.incidentEmergencyDispatchRepository.remove(existingDispatches);
      }

      return [];
    }

    const centers = await this.emergencyServiceCenterRepository.find({
      where: {
        isActive: true,
      },
    });

    if (existingDispatches.length > 0) {
      await this.incidentEmergencyDispatchRepository.remove(existingDispatches);
    }

    const dispatches = this.emergencyDispatchPolicyService
      .requiredServiceTypes()
      .map((serviceType) => {
        const nearestCenter = centers
          .filter((center) => center.serviceType === serviceType)
          .sort(
            (left, right) =>
              this.calculateDistanceKm(incident, left) - this.calculateDistanceKm(incident, right),
          )[0];

        if (!nearestCenter) {
          return null;
        }

        const distanceKm = this.calculateDistanceKm(incident, nearestCenter);

        return this.incidentEmergencyDispatchRepository.create({
          incidentId: incident.id,
          emergencyServiceCenterId: nearestCenter.id,
          serviceType,
          status: 'dispatched',
          distanceKm: distanceKm.toFixed(2),
          payload: {
            incidentId: incident.id,
            incidentTitle: incident.title,
            centerId: nearestCenter.id,
            centerName: nearestCenter.name,
            geographicArea: nearestCenter.geographicArea,
            contactNumber: nearestCenter.contactNumber,
          },
          dispatchedAt: new Date(),
          acknowledgedAt: null,
        });
      })
      .filter((dispatch): dispatch is IncidentEmergencyDispatchEntity => dispatch !== null);

    if (dispatches.length === 0) {
      return [];
    }

    await this.incidentEmergencyDispatchRepository.save(dispatches);
    return this.listByIncident(incidentId);
  }

  async listByIncident(incidentId: string) {
    const incident = await this.incidentRepository.findOne({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFoundException(`Incident ${incidentId} was not found.`);
    }

    return this.incidentEmergencyDispatchRepository.find({
      where: { incidentId },
      relations: {
        emergencyServiceCenter: true,
      },
      order: {
        distanceKm: 'ASC',
      },
    });
  }

  private calculateDistanceKm(incident: IncidentEntity, center: EmergencyServiceCenterEntity) {
    return this.locationService.calculateDistanceKm(
      Number(incident.latitude),
      Number(incident.longitude),
      Number(center.latitude),
      Number(center.longitude),
    );
  }
}
