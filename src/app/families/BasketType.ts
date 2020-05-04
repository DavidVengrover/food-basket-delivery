

import { StringColumn, IdColumn, IdEntity, BoolColumn, NumberColumn, DecorateDataColumnSettings, NumberColumnOptions } from '@remult/core';

import { HasAsyncGetTheValue } from "../model-shared/types";
import { Context, EntityClass } from '@remult/core';
import { ColumnOptions } from '@remult/core';
import { Roles } from "../auth/roles";

@EntityClass
export class BasketType extends IdEntity {

  name = new StringColumn({ caption: "שם" });

  boxes = new NumberColumn({ caption: BasketType.boxes1Name, defaultValue: 1 });
  boxes2 = new NumberColumn({ caption: BasketType.boxes2Name, defaultValue: 0 });
  constructor(context: Context) {
    super({
      name: "BasketType",
      allowApiRead: context.isSignedIn(),
      allowApiCRUD: Roles.admin,
      savingRow: async () => {
        if ((!this.boxes.value || this.boxes.value < 1) && (!this.boxes2.value || this.boxes2.value < 1))
          this.boxes.value = 1;
      }
    });
  }
  static boxes1Name = 'ארגזים';
  static boxes2Name = 'משהו אחר';
}
export class BasketId extends IdColumn implements HasAsyncGetTheValue {
  async addBasketTypes(quantity: NumberColumn, addColumn: (caption: string, v: string, t: import("xlsx/types").ExcelDataType) => void) {
    let r = await this.context.for(BasketType).lookupAsync(this);
    if (r) {

      addColumn(BasketType.boxes1Name, r.boxes.value ? (r.boxes.value * quantity.value).toString() : '', 'n');
      addColumn(BasketType.boxes2Name, r.boxes2.value ? (r.boxes2.value * quantity.value).toString() : '', 'n');
    }
  }
  constructor(private context: Context, settingsOrCaption?: ColumnOptions<string>) {
    super(settingsOrCaption, {
      dataControlSettings: () =>
        ({
          valueList: this.context.for(BasketType).getValueList({
            orderBy: (f: BasketType) => {
              return [{ column: f.name }];
            }
          })
          , width: '100'
        }),
    });
    if (!this.defs.caption)
      this.defs.caption = 'סוג סל';
  }
  get displayValue() {
    return this.context.for(BasketType).lookup(this).name.value;
  }
  async getTheValue() {
    let r = await this.context.for(BasketType).lookupAsync(this);
    if (r && r.name && r.name.value)
      return r.name.value;
    return '';
  }
}

export class QuantityColumn extends NumberColumn {
  constructor(settingsOrCaption?: NumberColumnOptions) {
    super(settingsOrCaption);
    if (!this.defs.caption)
      this.defs.caption = 'מספר סלים';
  }
}
