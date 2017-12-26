import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Actions, Effect } from '@ngrx/effects';
import { Dictionary } from '@ngrx/entity/src/models';
import { Action, Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { DialogService } from '../../../dialog/dialog-service/dialog.service';
import { Snapshot, Volume } from '../../../shared/models';
import { ISnapshotData } from '../../../shared/models/volume.model';
import { JobsNotificationService } from '../../../shared/services/jobs-notification.service';
import { SnapshotService } from '../../../shared/services/snapshot.service';
import { VirtualMachine, VmService, VmState } from '../../../vm';
// tslint:disable-next-line
import { SnapshotCreationComponent } from '../../../vm/vm-sidebar/storage-detail/volumes/snapshot-creation/snapshot-creation.component';
import { State } from '../../index';

import * as snapshot from './snapshot.actions';
import * as vmActions from '../../vm/redux/vm.actions';
import * as fromVolumes from '../../volumes/redux/volumes.reducers';
import * as fromVMs from '../../vm/redux/vm.reducers';


@Injectable()
export class SnapshotEffects {
  @Effect()
  loadSnapshots$: Observable<Action> = this.actions$
    .ofType(snapshot.LOAD_SNAPSHOT_REQUEST)
    .switchMap((action: snapshot.LoadSnapshotRequest) => {
      return this.snapshotService.getListAll(action.payload)
        .map((snapshots: Array<Snapshot>) => {
          return new snapshot.LoadSnapshotResponse(snapshots);
        })
        .catch(() => {
          return Observable.of(new snapshot.LoadSnapshotResponse([]));
        });
    });


  @Effect()
  addSnapshot$: Observable<Action> = this.actions$
    .ofType(snapshot.ADD_SNAPSHOT)
    .flatMap((action: snapshot.AddSnapshot) => {
      return this.dialog.open(SnapshotCreationComponent, {
        data: action.payload
      })
        .afterClosed()
        .filter(res => Boolean(res))
        .flatMap((params: ISnapshotData) => {

          const notificationId = this.jobsNotificationService.add(
            'JOB_NOTIFICATIONS.SNAPSHOT.TAKE_IN_PROGRESS');

          return this.snapshotService.create(
            action.payload.id,
            params.name,
            params.desc
          )
            .map(newSnap => {
              this.jobsNotificationService.finish({
                id: notificationId,
                message: 'JOB_NOTIFICATIONS.SNAPSHOT.TAKE_DONE'
              });
              return new snapshot.AddSnapshotSuccess(newSnap);
            })
            .catch(() => Observable.of(new snapshot.SnapshotUpdateError({
              id: notificationId,
              message: 'JOB_NOTIFICATIONS.SNAPSHOT.TAKE_FAILED'
            })));
        });
    });

  @Effect()
  deleteSnapshot$: Observable<Action> = this.actions$
    .ofType(snapshot.DELETE_SNAPSHOT)
    .flatMap((action: snapshot.DeleteSnapshot) => {
      return this.dialogService.confirm({ message: 'DIALOG_MESSAGES.SNAPSHOT.CONFIRM_DELETION' })
        .onErrorResumeNext()
        .filter(res => Boolean(res))
        .flatMap(() => {
          const notificationId = this.jobsNotificationService.add(
            'JOB_NOTIFICATIONS.SNAPSHOT.DELETION_IN_PROGRESS');
          return this.snapshotService.remove(action.payload.id)
            .map(() => {
              this.jobsNotificationService.finish({
                id: notificationId,
                message: 'JOB_NOTIFICATIONS.SNAPSHOT.DELETION_DONE'
              });

              return new snapshot.DeleteSnapshotSuccess(action.payload);
            })
            .catch(() => Observable.of(new snapshot.SnapshotUpdateError({
              id: notificationId,
              message: 'JOB_NOTIFICATIONS.SNAPSHOT.DELETION_FAILED'
            })));
        });
    });
  @Effect()
  revertVolumeToSnapshot$: Observable<Action> = this.actions$
    .ofType(snapshot.REVERT_VOLUME_TO_SNAPSHOT)
    .switchMap((action: snapshot.RevertVolumeToSnapshot) => {
      return this.dialogService.confirm({
        message: 'DIALOG_MESSAGES.SNAPSHOT.CONFIRM_REVERTING'
      })
        .onErrorResumeNext()
        .filter(res => Boolean(res))
        .switchMap(() => {
          const notificationId = this.jobsNotificationService.add(
            'JOB_NOTIFICATIONS.SNAPSHOT.REVERT_IN_PROGRESS');
          return this.snapshotService.revert(action.payload.id)
            .map(() => {
              this.jobsNotificationService.finish({
                id: notificationId,
                message: 'JOB_NOTIFICATIONS.SNAPSHOT.REVERT_DONE'
              });

              return new snapshot.RevertVolumeToSnapshotSuccess(action.payload);
            })
            .catch(() => Observable.of(new snapshot.SnapshotUpdateError({
              id: notificationId,
              message: 'JOB_NOTIFICATIONS.SNAPSHOT.REVERT_FAILED'
            })));
        });
    });

  @Effect()
  revertVolumeToSnapshot$: Observable<Action> = this.actions$
    .ofType(snapshot.REVERT_VOLUME_TO_SNAPSHOT)
    .withLatestFrom(
      this.store.select(fromVolumes.selectEntities),
      this.store.select(fromVMs.selectEntities)
    )
    .flatMap(([action, volumes, vms]: [
      snapshot.RevertVolumeToSnapshot, Dictionary<Volume>, Dictionary<VirtualMachine>
      ]) => {
      const vmId = Object.entries(volumes)
        && volumes[action.payload.volumeid]
        && volumes[action.payload.volumeid].virtualmachineid;
      const isVmRunning = Object.entries(vms).length && vms[vmId] && vms[vmId].state === VmState.Running;

      return this.dialogService.confirm({
        message: isVmRunning
          ? 'DIALOG_MESSAGES.SNAPSHOT.CONFIRM_REVERTING_WITH_VM_REBOOT'
          : 'DIALOG_MESSAGES.SNAPSHOT.CONFIRM_REVERTING'
      })
        .onErrorResumeNext()
        .filter(res => Boolean(res))
        .flatMap(() => (isVmRunning
          ? this.vmService.command(vms[vmId], 'stop')
          : Observable.of(null))
          .flatMap(() => {
            const notificationId = this.jobsNotificationService.add(
              'JOB_NOTIFICATIONS.SNAPSHOT.REVERT_IN_PROGRESS');
            return this.snapshotService.revert(action.payload.id)
              .flatMap(() => {
                this.jobsNotificationService.finish({
                  id: notificationId,
                  message: 'JOB_NOTIFICATIONS.SNAPSHOT.REVERT_DONE'
                });

                return isVmRunning
                  ? [
                    new snapshot.RevertVolumeToSnapshotSuccess(action.payload),
                    new vmActions.StartVm(vms[vmId])
                  ]
                  : [new snapshot.RevertVolumeToSnapshotSuccess(action.payload)];
              })
              .catch(() => Observable.of(new snapshot.SnapshotUpdateError({
                id: notificationId,
                message: 'JOB_NOTIFICATIONS.SNAPSHOT.REVERT_FAILED'
              })));
          }));
    });

  @Effect({ dispatch: false })
  handleError$ = this.actions$
    .ofType(snapshot.SNAPSHOT_UPDATE_ERROR)
    .do((action: snapshot.SnapshotUpdateError) => {
      this.jobsNotificationService.fail(action.payload);
    });


  constructor(
    private store: Store<State>,
    private actions$: Actions,
    private snapshotService: SnapshotService,
    private jobsNotificationService: JobsNotificationService,
    private dialogService: DialogService,
    private dialog: MatDialog,
    private vmService: VmService
  ) {
  }
}
