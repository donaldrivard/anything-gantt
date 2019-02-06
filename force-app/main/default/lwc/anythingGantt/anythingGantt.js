import { LightningElement, api, track } from 'lwc';
import { getChartBoundaries, createPeriods } from './calc';
// import * as moment from 'anythingGantt/moment';

import { fakeData } from './fakeData';

export default class AnythingGantt extends LightningElement {

    // design attributes
    @api objectName;
    @api startDateField;
    @api endDateField;
    @api period; // day, week, month, quarter, year
    @api periodLabelFormat;
    @api referenceDate = new Date();
    @api superPeriod;
    @api superPeriodLabelFormat;
    @api inputPeriodCount;
    @api colorCodeField;
    @api noParentField;
    @api relatedListField
    @api labelField;
    @api filterFields;
    @api filterFieldLabels;
    @api innerGrouping;
    @api innerGroupingLabel;
    @api outerGrouping;
    @api outerGroupingLabel;
    @api singleRow = false;
    @api showTodayLine = false;

    // query the records for object name, and any included fields

    // create the data for the chart
    maxDate = new Date();
    groupingColumnWidth = '20px;';
    @track header = {
        periods: [],
        superPeriods: []
    };

    @track dayCount = 0;

    get containerStyle() {
        const styles = [];

        if (this.outerGrouping && this.innerGrouping){
            styles.push(`grid-template-columns: [outer] ${this.groupingColumnWidth} [inner] ${this.groupingColumnWidth} repeat(${this.chartDays}, auto, [day-column])`);
        } else if (this.innerGrouping) {
            styles.push(`grid-template-columns: [inner] ${this.groupingColumnWidth} repeat(${this.header.periods.length}, auto, [gantt-columns])`);
        } else {
            styles.push(`grid-template-columns: repeat(${this.header.periods.length}, auto, [gantt-columns])`);
        }

        return styles;
    }

    constructor(){
        super();
        this.objectName = 'Project__c';
        this.startDateField = 'Started_Timestamp__c';
        this.endDateField = 'Done_Timestamp__c';
        this.period = 'day';
        this.periodLabelFormat = 'M/D/YY';
        this.labelField = 'Name';
    }

    // TODO: use real data
    connectedCallback() {
        this.rawData = fakeData.result.records;     
        
        ({ startOfChart: this.startOfChart, endOfChart: this.endOfChart, chartDays: this.chartDays} = getChartBoundaries(this.rawData, this.period, this.superPeriod, this.referenceDate, this.endDateField));
        this.header.periods = createPeriods(this.startOfChart, this.endOfChart, this.period, this.periodLabelFormat);
        if (this.superPeriod){
            this.header.superPeriods = createPeriods(this.startOfChart, this.endOfChart, this.superPeriod, this.superPeriodLabelFormat);
        } 
    }

    buildQuery(){
        const fields = new Set(['Id', this.startDateField, this.endDateField]);
        const optionalFields = ['colorCodeField', 'labelField', 'noParentField', 'innerGrouping', 'outerGrouping'];
        for (const field of optionalFields){
            if (this[field]){
                fields.add(this[field]);
            }
        }
        return `select ${[...fields].join(',')} from ${this.objectName} where ${this.startDateField} != null and ${this.endDateField} != null`;
    }
}