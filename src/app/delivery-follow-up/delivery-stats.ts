import { ServerFunction, AndFilter } from '@remult/core';
import { FilterBase } from '@remult/core';

import { HelpersAndStats } from "./HelpersAndStats";
import { colors } from "../families/stats-action";

import { Context } from '@remult/core';
import { Roles } from "../auth/roles";


export interface InArgs {

}
export interface OutArgs {
    data: any;

}
export class DeliveryStats {
    notOutYet = new DeliveryStatistic('טרם נשלח SMS', f => f.deliveriesInProgress.isGreaterOrEqualTo(1).and(f.gotSms.isDifferentFrom(true)), colors.blue);
    onTheWay = new DeliveryStatistic('בדרך', f => f.deliveriesInProgress.isGreaterOrEqualTo(1).and(f.gotSms.isEqualTo(true)).and(f.smsDate.isGreaterThan(new Date(new Date().valueOf() - 3600000 * 1.5))), colors.blue);
    late = new DeliveryStatistic('מתעכבים', f => f.deliveriesInProgress.isGreaterOrEqualTo(1).and(f.gotSms.isEqualTo(true)).and(f.smsDate.isLessOrEqualTo(new Date(new Date().valueOf() - 3600000 * 1.5))), colors.yellow);
    delivered = new DeliveryStatistic('סיימו', f => f.deliveriesInProgress.isEqualTo(0).and(f.deliveriesWithProblems.isEqualTo(0)).and(f.allFamilies.isGreaterOrEqualTo(1)), colors.green);
    problem = new DeliveryStatistic('בעיות', f => f.deliveriesWithProblems.isGreaterOrEqualTo(1), colors.red);


    async getData(distCenter) {
        let r = await DeliveryStats.getTheStats(distCenter);
        for (let s in this) {
            let x: any = this[s];
            if (x instanceof DeliveryStatistic) {
                x.loadFrom(r.data);
            }
        }
    }
    @ServerFunction({ allowed: Roles.distCenterAdmin })
    static async getTheStats(distCenter: string, context?: Context) {
        let result = { data: {} };
        let stats = new DeliveryStats();
        let pending = [];
        for (let s in stats) {
            let x = stats[s];
            if (x instanceof DeliveryStatistic) {
                pending.push(x.saveTo(result.data, context, distCenter));
            }
        }
        await Promise.all(pending);
        return result;
    }
}

export class DeliveryStatistic {
    constructor(public name: string, public rule: (f: HelpersAndStats) => FilterBase, public color: string) {

    }

    value = 0;
    async saveTo(data: any, context: Context, distCenter: string) {

        data[this.name] = await context.for(HelpersAndStats).count(f => this.rule(f)).then(c => this.value = c);
    }
    async loadFrom(data: any) {
        this.value = data[this.name];
    }
}

