import moment from './moment.js';

const getMaxDate = (queriedData, endDateField) => {
    return moment.max(
        ...(queriedData.map( d => moment(d[endDateField])))
    );
}

const getChartBoundaries = (queriedData, period, superPeriod, referenceDate = new Date(), endDateField) => {
    const startOfChart = moment.min(
        moment(referenceDate).startOf(period),
        moment(referenceDate).startOf(superPeriod)
    );

    const dataMaxDate = getMaxDate(queriedData, endDateField);

    const endOfChart = moment.max(
        dataMaxDate.endOf(period),
        dataMaxDate.endOf(superPeriod)
    )

    return {startOfChart: startOfChart.toDate(), endOfChart: endOfChart.toDate(), chartDays: endOfChart.diff(startOfChart, 'days')};

}

const createPeriods = (startOfChart, endOfChart, period, format) => {
    const periodPlural = `${period}s`;

    const output = [];

    let dateCounter = moment(startOfChart);        
    while (dateCounter.isBefore(endOfChart)){

        output.push({
            label: dateCounter.format(format),
            startDay: dateCounter.diff(startOfChart, 'days')+1,
            endDay: moment(dateCounter).endOf(period).diff(moment(startOfChart), 'days')+1
        });
        dateCounter.add(1, periodPlural);
    }
    return output;
}

export { getMaxDate, getChartBoundaries, createPeriods};