import {getMaxDate, getChartBoundaries, createPeriods} from '../calc';
import * as fakeData from '../__tests__/data/fakeData.json';
import moment from '../moment';


const refDate = new Date('2019-01-16T04:04:00');

const eod = new Date('2019-02-05T05:59:59.999Z');
const eow = new Date('2019-02-10T05:59:59.999Z');
const eom = new Date('2019-03-01T05:59:59.999Z');
const eoq = new Date('2019-04-01T04:59:59.999Z');
const eoy = new Date('2020-01-01T05:59:59.999Z');

const bod = new Date('2019-01-16T06:00:00.000Z');
const bow = new Date('2019-01-13T06:00:00.000Z');
const bom = new Date('2019-01-01T06:00:00.000Z');
const boq = new Date('2019-01-01T06:00:00.000Z');
const boy = new Date('2019-01-01T06:00:00.000Z')

describe('tests the max Date logic', () => {

    it('validates moment import', () => {
        expect(moment()).toBeTruthy();
    });

    it('returns the max date from some data', () => {
        const maxDate = getMaxDate(fakeData.result.records, 'Done_Timestamp__c');
        //        "Done_Timestamp__c": "2019-02-04T16:00:32.000+0000",
        expect(maxDate.toDate()).toEqual(moment.utc('2019-02-04T16:00:32').toDate());
    });

    it('handles no end date field present gracefully', () => {
        const maxDate = getMaxDate(fakeData.result.records, undefined);
        expect(maxDate.toDate()).toBeTruthy();
    });
    it('handles endDateField that does not match the data', () => {
        const maxDate = getMaxDate(fakeData.result.records, 'Crap__c');
        expect(maxDate.toDate()).toBeTruthy();
    });
});


describe('tests the chartBoundaries logic', () => {

    it('works with day as period, no superperiod', () => {
        const boundaries = getChartBoundaries(fakeData.result.records, 'day', undefined, refDate, 'Done_Timestamp__c');
        expect(boundaries.startOfChart).toEqual(bod);
        expect(boundaries.endOfChart).toEqual(eod);
    });
    it('works with week as period, no superperiod', () => {
        const boundaries = getChartBoundaries(fakeData.result.records, 'week', undefined, refDate, 'Done_Timestamp__c');
        expect(boundaries.startOfChart).toEqual(bow);
        expect(boundaries.endOfChart).toEqual(eow);
    });
    it('works with month as period, no superperiod', () => {
        const boundaries = getChartBoundaries(fakeData.result.records, 'month', undefined, refDate, 'Done_Timestamp__c');
        expect(boundaries.startOfChart).toEqual(bom);
        expect(boundaries.endOfChart).toEqual(eom);
    });
    it('works with quarter as period, no superperiod', () => {
        const boundaries = getChartBoundaries(fakeData.result.records, 'quarter', undefined, refDate, 'Done_Timestamp__c');
        expect(boundaries.startOfChart).toEqual(boq);
        expect(boundaries.endOfChart).toEqual(eoq);
    });
    it('works with year as period, no superperiod', () => {
        const boundaries = getChartBoundaries(fakeData.result.records, 'year', undefined, refDate, 'Done_Timestamp__c');
        expect(boundaries.startOfChart).toEqual(boy);
        expect(boundaries.endOfChart).toEqual(eoy);
    });
    it('works with day as period, week as superperiod', () => {
        const boundaries = getChartBoundaries(fakeData.result.records, 'day', 'week', refDate, 'Done_Timestamp__c');
        expect(boundaries.startOfChart).toEqual(bow);
        expect(boundaries.endOfChart).toEqual(eow);
    });
    it('works with day as period, month as superperiod', () => {
        const boundaries = getChartBoundaries(fakeData.result.records, 'day', 'month', refDate, 'Done_Timestamp__c');
        expect(boundaries.startOfChart).toEqual(bom);
        expect(boundaries.endOfChart).toEqual(eom);
    });
    it('works with week as period, month as superperiod', () => {
        const boundaries = getChartBoundaries(fakeData.result.records, 'week', 'month', refDate, 'Done_Timestamp__c');
        expect(boundaries.startOfChart).toEqual(bom);
        expect(boundaries.endOfChart).toEqual(eom);
    });

    it('works with day as period, no superperiod, reference date of 4/15', () => {
        const boundaries = getChartBoundaries(fakeData.result.records, 'day', undefined, new Date('2019-04-15T12:00:00'), 'Done_Timestamp__c');
        expect(boundaries.startOfChart).toEqual(new Date('2019-04-15T05:00:00.000Z'));
        expect(boundaries.endOfChart).toEqual(eod);
    });

});

describe('creates periods/superperiods', () => {
    it('handles day', () => {
        const periods = createPeriods(boy, eoy, 'day', 'MM/DD/YYYY');
        expect(periods).toHaveLength(365);
        periods.forEach( period => {
            expect(period.startDay).toBeGreaterThan(0);
            expect(period.endDay).toBeGreaterThan(0);
        });
    });

    it('handles week', () => {
        const boundaries = getChartBoundaries(fakeData.result.records, 'week', undefined, new Date('2018-04-15T12:00:00'), 'Done_Timestamp__c');
        const periods = createPeriods(boundaries.startOfChart, boundaries.endOfChart, 'week', 'w');
        expect(periods).toHaveLength(43);
        periods.forEach( period => {
            expect(period.startDay).toBeGreaterThan(0);
            expect(period.endDay).toBeGreaterThan(0);
            expect(period.startDay).toBeLessThan(320);
            expect(period.endDay).toBeLessThan(320);
            expect((period.startDay -1) % 7 ).toBe(0); // they're multiples of 7 if you back it down
        });
    });
});