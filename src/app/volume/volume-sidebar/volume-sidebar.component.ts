import { Component, HostBinding, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { Volume } from '../../shared/models';
import { DateTimeFormatterService } from '../../shared/services/date-time-formatter.service';
import { NotificationService } from '../../shared/services/notification.service';
import { VolumeService } from '../../shared/services/volume.service';


@Component({
  selector: 'cs-volume-sidebar',
  templateUrl: 'volume-sidebar.component.html',
  styleUrls: ['volume-sidebar.component.scss']
})
export class VolumeSidebarComponent extends SidebarComponent<Volume> {
  @Input() public entity: Volume;
  @HostBinding('class.grid') public grid = true;

  constructor(
    public dateTimeFormatterService: DateTimeFormatterService,
    protected notificationService: NotificationService,
    protected route: ActivatedRoute,
    protected router: Router,
    protected volumeService: VolumeService,
  ) {
    super(volumeService, notificationService, route, router);
  }
}
