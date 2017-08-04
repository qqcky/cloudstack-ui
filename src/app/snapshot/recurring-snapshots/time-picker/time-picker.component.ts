import { MdlTextFieldComponent } from '@angular-mdl/core';
import { Component, forwardRef, Input, OnInit, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TimeFormat, TimeFormats } from '../../../shared/services';
import { DayPeriod } from '../day-period/day-period.component';
import { padStart } from '../../../shared/utils/padStart';


export interface Time {
  hour: number;
  minute: number;
  period?: DayPeriod;
}

@Component({
  selector: 'cs-time-picker',
  templateUrl: 'time-picker.component.html',
  styleUrls: ['time-picker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimePickerComponent),
      multi: true
    }
  ]
})
export class TimePickerComponent implements ControlValueAccessor, OnInit {
  @Input() public timeFormat: TimeFormat;
  @ViewChild('hourField') public hourField: MdlTextFieldComponent;
  @ViewChild('minuteField') public minuteField: MdlTextFieldComponent;

  public _hour: number;
  public _minute: number;
  public period: DayPeriod;

  public minMinuteValue = 0;
  public maxMinuteValue = 59;

  public ngOnInit(): void {
    this._hour = this.minHourValue;
    this._minute = this.minMinuteValue;

    if (this.timeFormat === TimeFormats.hour12) {
      this.period = DayPeriod.Am;
    }
  }

  public get showPeriodSelector(): boolean {
    return this.timeFormat === TimeFormats.hour12;
  }

  public get hour(): string {
    return this._hour && this._hour.toString();
  }

  public set hour(value: string) {
    this._hour = +value;
  }

  public get minute(): string {
    return padStart(this._minute.toString(), 2);
  }

  public set minute(value: string) {
    this._minute = +value;
  }

  public get minHourValue(): number {
    if (this.timeFormat === TimeFormats.hour12) {
      return 1;
    } else {
      return 0;
    }
  }

  public get maxHourValue(): number {
    if (this.timeFormat === TimeFormats.hour12) {
      return 12;
    } else {
      return 23;
    }
  }

  public updateHour(value: number): void {
    let newValue: string;

    if (Number.isNaN(value) || value == null) {
      newValue = this.hour;
    } else {
      if (value === this.maxHourValue + 1) {
        newValue = this.minHourValue.toString();
      } else if (value > this.maxHourValue) {
        newValue = value.toString().substr(-1);
      } else if (value < this.minHourValue) {
        newValue = this.maxHourValue.toString();
      } else {
        newValue = value && value.toString();
      }
    }

    this.hour = newValue;
    this.hourField.inputEl.nativeElement.value = this.hour;
    this.hourField.writeValue(this.hour);
    this.writeValue(this.time);
  }

  public updateMinute(value: number): void {
    let newValue: string;

    if (Number.isNaN(value) || value == null) {
      newValue = this.minute;
    } else {
      if (value > this.maxMinuteValue) {
        newValue = padStart(this.minMinuteValue, 2);
      } else if (value < this.minMinuteValue) {
        newValue = padStart(this.maxMinuteValue, 2);
      } else {
        newValue = padStart(value, 2);
      }
    }

    this.minute = newValue;
    this.minuteField.inputEl.nativeElement.value = this.minute;
    this.minuteField.writeValue(this.minute);
    this.writeValue(this.time);
  }

  public updatePeriod(value: DayPeriod): void {
    this.period = value;
    this.writeValue(this.time);
  }

  public propagateChange: any = () => {};

  @Input()
  public get time(): Time {
    return {
      hour: +this.hour,
      minute: +this.minute,
      period: this.period
    }
  }

  public set time(value: Time) {
    if (value) {
      this.hour = (value.hour || this.minHourValue).toString();
      this.minute = (value.minute || this.minMinuteValue).toString();
      this.period = value.period;

      this.propagateChange(this.time);
    }
  }

  public registerOnChange(fn): void {
    this.propagateChange = fn;
  }

  public registerOnTouched(): void { }

  public writeValue(value: any): void {
    if (value) {
      this.time = value;
    }
  }
}