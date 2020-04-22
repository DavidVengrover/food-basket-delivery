import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Families } from '../families/families';
import * as copy from 'copy-to-clipboard';
import { DialogService } from '../select-popup/dialog';
import { DeliveryStatus } from '../families/DeliveryStatus';
import { Context } from '@remult/core';

import { translate } from '../translate';
import { UpdateCommentComponent } from '../update-comment/update-comment.component';
import { UpdateFamilyDialogComponent } from '../update-family-dialog/update-family-dialog.component';
import { extractError } from '../model-shared/types';
@Component({
  selector: 'app-family-info',
  templateUrl: './family-info.component.html',
  styleUrls: ['./family-info.component.scss']
})
export class FamilyInfoComponent implements OnInit {

  constructor(private dialog: DialogService, private context: Context) { }
  @Input() f: Families;
  @Input() showHelp = false;
  ngOnInit() {
  }
  actuallyShowHelp() {
    return this.showHelp && this.f.deliverStatus.value != DeliveryStatus.ReadyForDelivery;
  }
  @Input() partOfAssign: Boolean;
  @Output() assignmentCanceled = new EventEmitter<void>();
  async SendHelpSms() {
    window.open('sms:' + this.f.courierHelpPhone() + ';?&body=' + encodeURI(`הי ${this.f.courierHelpName()}  זה ${this.context.user.name}, נתקלתי בבעיה אצל ${translate('משפחת')} ${this.f.name.value}`), '_blank');
  }
  showCancelAssign(f: Families) {
    return this.partOfAssign && f.courier.value != '' && f.deliverStatus.value == DeliveryStatus.ReadyForDelivery;
  }
  showFamilyPickedUp(f: Families) {
    return f.deliverStatus.value == DeliveryStatus.SelfPickup;
  }
  async familiyPickedUp(f: Families) {
    this.context.openDialog(UpdateCommentComponent, x => x.args =
    {
      family: f,
      comment: f.courierComments.value,
      assignerName: f.courierHelpName(),
      assignerPhone: f.courierHelpPhone(),
      helpText: s => s.commentForSuccessDelivery,
      ok: async (comment) => {
        f.deliverStatus.value = DeliveryStatus.SuccessPickedUp;
        f.courierComments.value = comment;
        f.checkNeedsWork();
        try {
          await f.save();
          this.dialog.analytics('Self Pickup');
        }
        catch (err) {
          this.dialog.Error(extractError( err));
        }
      },
      cancel: () => { }
    });

  }
  async cancelAssign(f: Families) {

    this.assignmentCanceled.emit();

  }
  openWaze(f: Families) {
    if (!f.addressOk.value) {
      this.dialog.YesNoQuestion(translate("הכתובת אינה מדוייקת. בדקו בגוגל או התקשרו למשפחה. נשמח אם תעדכנו את הכתובת שמצאתם בהערות. האם לפתוח וייז?"), () => {
        f.openWaze();
      });
    }
    else
      f.openWaze();


  }
  udpateInfo(f: Families) {
    this.context.openDialog(UpdateFamilyDialogComponent, x => x.args = { f: f });
  }
  copyAddress(f: Families) {
    copy(f.address.value);
    this.dialog.Info("הכתובת " + f.address.value + " הועתקה בהצלחה");
  }
  showStatus() {
    return this.f.deliverStatus.value != DeliveryStatus.ReadyForDelivery && this.f.deliverStatus.value != DeliveryStatus.SelfPickup;
  }
}
