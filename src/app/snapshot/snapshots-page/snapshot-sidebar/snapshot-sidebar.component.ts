import { Component, Input } from '@angular/core';
import { Dictionary } from '@ngrx/entity/src/models';
import {
  getDateSnapshotCreated,
  getSnapshotDescription,
  Snapshot, Volume
} from '../../../shared/models';

@Component({
  selector: 'cs-snapshot-sidebar',
  templateUrl: 'snapshot-sidebar.component.html'
})
export class SnapshotSidebarComponent {
  @Input() public snapshot: Snapshot;
  @Input() public volumes: Dictionary<Volume>;
  @Input() public isLoading: boolean;

  public get notFound(): boolean {
    return !this.snapshot;
  };

  public get snapshotCreated() {
    return getDateSnapshotCreated(this.snapshot);
  }

  public get snapshotType() {
    return `SNAPSHOT_PAGE.SIDEBAR.TYPES.${this.snapshot.snapshottype}`;
  }

  public get snapshotDescription() {
    return getSnapshotDescription(this.snapshot);
  }

  public get volume() {
    return this.snapshot.volumeid && this.volumes && this.volumes[this.snapshot.volumeid];
  }
}
