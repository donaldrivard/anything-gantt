({

	runAll : function(component){
		var data = JSON.parse(component.get("v.originalData"));
        //console.log("data in RunAll is");
        //console.log(data);

        //check filter field values
        data = this.applyFilters(component, data);
        

        this.organizeData(component, data);        
        
        console.log("final data structure");
        console.log(component.get("v.data"));

    },
    

    applyFilters : function (component, recordList){
    	var helper = this;
    	var filters = [];

    //console.log("preFilter");
    //console.log(recordList);
    _.forEach(helper.CSL2Array(component.get("v.filterFields")), function (field){
    	var filterValue = component.get("v.filterValues")[field];
      //console.log(field + ":" + filterValue);
      if (filterValue !== "Any"){
      	recordList = _.filter(recordList, [field , filterValue])
      }      
  });
    //console.log("postFilter");
    //console.log(recordList);
    

    return recordList;
},

buildQuery : function(component){

	var helper = this;
	var startDateField = component.get("v.startDateField");
	var endDateField = component.get("v.endDateField");

	var refDate = component.get("v.referenceDate")
	console.log(refDate);

	var extraFieldArray = [];


	var query = "Select Id, " + startDateField + ", " + endDateField;

	if (component.get("v.colorCodeField")){
      //query = query + ", " + component.get("v.colorCodeField");
      extraFieldArray.push(component.get("v.colorCodeField"))
  }
  if (component.get("v.labelField")){
      //query = query + ", " + component.get("v.colorCodeField");
      extraFieldArray.push(component.get("v.labelField"))
  }
  if (component.get("v.noParentField")){
      //query = query + ", " + component.get("v.noParentField");
      extraFieldArray.push(component.get("v.noParentField"))

  }
  if (component.get("v.innerGrouping")){
      //query = query + ", " + component.get("v.innerGrouping");
      extraFieldArray.push(component.get("v.innerGrouping"))

  }
  if (component.get("v.outerGrouping")){
      //query = query + ", " + component.get("v.outerGrouping");
      extraFieldArray.push(component.get("v.outerGrouping"))

  }
  if (component.get("v.filterFields")){
      //query = query + ", " + component.get("v.filterFields");
      _.forEach(helper.CSL2Array(component.get("v.filterFields")), function(field){
      	extraFieldArray.push(field);
      })
  }
  console.log("before Dupe");

  console.log(extraFieldArray);
    //dedupe just in case 
    extraFieldArray = _.uniq(extraFieldArray);
    
    console.log("after Dupe");
    console.log(extraFieldArray);


    if (extraFieldArray.length>0){
    	query = query + ', ' + extraFieldArray.join();
    	console.log("with extra fields");
    	console.log(query);
    }

    var desc = component.get("v.objectDescribe");
    //base
    query = query + " from " + component.get("v.objectName") 
    //datetime vs. date handling on startdate query
    if ( _.find(desc.fields, {'name' : startDateField} ).type==='datetime'){
    	query = query + " where " + startDateField + " >= " + moment(refDate).toISOString() // + " and " + endDateField + " >= " + moment(refDate).toISOString();    	
    } else if ( _.find(desc.fields, {'name' : startDateField} ).type==='date'){
    	query = query + " where " + startDateField + " >= " + moment(refDate).format('YYYY-MM-DD') // + " and " + endDateField + " >= " + moment(refDate).toISOString();    	
    }

    if ( _.find(desc.fields, {'name' : endDateField} ).type==='datetime'){
    	query = query + " and " + endDateField + " >= " + moment(refDate).toISOString() // + " and " + endDateField + " >= " + moment(refDate).toISOString();    	
    } else if ( _.find(desc.fields, {'name' : endDateField} ).type==='date'){
    	query = query + " and " + endDateField + " >= " + moment(refDate).format('YYYY-MM-DD') // + " and " + endDateField + " >= " + moment(refDate).toISOString();    	
    }

    //query = query + " and " + startDateField + " < " + endDateField;

    //optional related list filter
    if (component.get("v.relatedListField")){
    	query = query + " and " + component.get("v.relatedListField") + " = '" + component.get("v.recordId") +  "'" ;
    }
    //order by
    query = query + " order by " + startDateField; 
    console.log(query);
    return query;
},

buildLegend : function(component, recordList){
	console.log("color code field: " + component.get("v.colorCodeField"));
	var colorCodeArray = _.uniq(_.map(recordList, component.get("v.colorCodeField")));
	console.log(colorCodeArray);
	component.set("v.colorCodeArray", colorCodeArray);
},

organizeData : function(component, recordList) {

    //transform to nested array since aura:iteration can't do objects
    var result = [];  
    var records = [];

    var colorCodeArray = component.get("v.colorCodeArray");

    _.forEach(recordList, function(record){
    	
    	var newRecord = record;
    	if (component.get("v.labelField")){
    		newRecord.label = record[component.get("v.labelField")];
    	}
    	if (component.get("v.colorCodeField")){
    		newRecord.colorClass = "cc" + _.indexOf(colorCodeArray, record[component.get("v.colorCodeField")]);
    	} else {
        //default color if no color coding is requested
        newRecord.colorClass = "slds-theme--inverse";
    }
    newRecord.left = _.round((moment(record[component.get("v.startDateField")]).diff(moment(component.get("v.referenceDate")), 'days')/component.get("v.dayCount")*100), 3).toString();
    
    var endMoment;; //default to now, will override if a date exists on the record

    if(record[component.get("v.endDateField")]){
      //bar length shouldn't exceed the top-level timeframe (refdate through periodCount)
      endMoment = moment.min(
        moment(record[component.get("v.endDateField")]), //end of the record's time
        moment(component.get("v.referenceDate")).add(component.get("v.dayCount"), 'days')
      ); 
    } else {
      endMoment = moment(); //if there is no date value in the field, we'll use now instead so we can show something
    }
    
    newRecord.width = _.round(endMoment.diff(moment(record[component.get("v.startDateField")]), 'days')  /  component.get("v.dayCount")*100 , 3).toString(); 
    //console.log(newRecord.width);
    records.push(newRecord);
  });

    var groupedData = _.groupBy(records, component.get("v.outerGrouping"));
    
    //iterate the outer groupings (ex: facility)
    _.forEach(groupedData, function (outerGroupArray, outerGroupingName){ 
      //this is a group of records under that facility
      var temp = [];  
      var innerStuff = _.groupBy(outerGroupArray, component.get("v.innerGrouping"));
      _.forEach(innerStuff, function(innerGroupArray, innerGroupingName){
      	temp.push({
      		"name" : innerGroupingName,
      		"data" : innerGroupArray          
      	});
      });
      //done with that outer grouping
      result.push({
      	"name" : outerGroupingName,
      	"data" : temp
      });
  });
    console.log(result);
    component.set("v.data", result);
},

  //Avada Kedavra, James and Lilly
  removeParents: function(component, recordList){
  	if (component.get("v.noParentField")){
      //list of parents
      var parentIds = _.uniq(_.map(recordList, component.get("v.noParentField")));
      return _.filter(recordList, function(record){
        //return true if the Id is not included in the parentIds array
        return !_.includes(parentIds, record.Id); 
    });
  } else {
  	return recordList;
  }
},

buildFilters : function (component, recordList){
  console.log("starting Filter Build");

	var filterFields = this.CSL2Array(component.get("v.filterFields"));
	var optionClass = "";

	var labels = this.CSL2Array(component.get("v.filterFieldLabels"));
	console.log("labels");
	
	console.log(labels);


	if (filterFields.length>0){
      //where we'll put the components
      var filterArea = component.get("v.filterArea");
      var filterValues = component.get("v.filterValues") || {};
      //loop through each field and create the filter components
      console.log("building filters");

      _.forEach(filterFields, function(field, key){
        //filterValues[key] = "Any";
        filterValues[field] = "Any";  
        console.log("doing filter field: " + field);
        //build options
        var options = [];
        options.push({
        	"class" : optionClass,
        	"label" : "--Any--",
        	"value" : "Any",
        	"selected" : "true"
        });

        _.forEach(_.uniq(_.map(recordList, field)), function(option){
        	console.log("filter option is " + option);
        	options.push({
        		"class" : optionClass,
        		"label" : option,
        		"value" : option 
        	})
        });

        console.log("label is:");
        console.log(labels[_.indexOf(filterFields, field)]);
        
        $A.createComponents(
        	[          
        	[
              "ui:inputSelect", //component type
              {  //properties array
              	"aura:id" : "filter"+field,
              	"options" : options,
              	"change" : component.getReference("c.filterChange"),
              	"label" : labels[_.indexOf(filterFields, field)]
              }
              ],
              [
              "lightning:layoutItem", 
              {
              	"padding" : "around-small"
              }
              ]
              ], 
              function(components, status, errorMessage){
            //workaround found on GUS
            //cmp.index(component.getLocalId(), component.getGlobalId())            

            if (status === "SUCCESS") {
            	components[1].set("v.body", components[0]);
            	filterArea.push(components[1]);
            } else if (status === "INCOMPLETE"){
            	console.log("No response from server or client is offline.")
            } else if (status === "INCOMPLETE"){
            	console.log("Error: " + errorMessage);
            }
        }
        );
      }); //end the forEach loop for fields
      component.set("v.filterValues", filterValues);
      //put our new structure onto the page
      component.set("v.filterArea", filterArea);
      console.log("done with Filter Build");

  }
},

subArray : function(refDate, periodType, endDate, dayCount, format){
	var decimalPlaces = 4;

	if (periodType === 'NONE'){
		return null;
	}
  	// console.log("subarray output");
  	// console.log('refDate');
  	// console.log(refDate);
  	console.log('periodType');
  	console.log(periodType);
  	console.log('endDate');
  	console.log(endDate);
  	// console.log('dayCount');
  	// console.log(dayCount);
  	// console.log('format');
  	// console.log(format);

  	var momentCounter = moment(refDate);
  	var output = [];

  	var stop = false;
  	do {
  		if (momentCounter.isAfter(moment(endDate))){
      	stop = true; //we'll always get one extra period completed this way
      }

      var thisCounter = momentCounter.toDate();
      console.log("current period");
      console.log(thisCounter);
      
      var startPeriod;
      if (output.length==0){
      	startPeriod = thisCounter;
      } else {
      	startPeriod = moment(thisCounter).startOf(periodType).toDate();      	
      }
      //version that really uses refdate
      console.log("start of period");
      console.log(startPeriod);
      
      var endPeriod = moment(thisCounter).endOf(periodType).toDate();
      console.log("end of period");

      console.log(endPeriod);

      var daysInPeriod = Math.min(
      	moment(endPeriod).diff(moment(startPeriod), 'days'),
      	moment(endDate).diff(moment(startPeriod), 'days') 
      	);
      if (daysInPeriod > 0){
      	daysInPeriod++;
      	console.log("days in period");
      	console.log(daysInPeriod);

	      // 60/900 * 10000
	      //var width = (Math.floor((daysInPeriod/dayCount)*Math.pow(10, decimalPlaces))/Math.pow(10, decimalPlaces))*100;
	      var width = (daysInPeriod/dayCount)*100
	      console.log("width: " + width);
	      output.push({
	      	"width": width.toFixed(5),
	      	"label": momentCounter.format(format),
	      	"days" : daysInPeriod
	      });      	
	  }
	  momentCounter.add(1, periodType+'s');
	  
	} while (!stop)


    //check for !== 100 and scale accordingly
    var total = _.sumBy(output, function(o){return o.width*1});
    console.log("total : " + total);
    
    var delta = total - 100; //>1 is too large, <1 is too small
    console.log("delta : " + delta);

    _.forEach(output, function(value){
    	//distribute the error based on the size of the bars
    	value.width = value.width - delta * (value.days/dayCount);
    })
    return output;
},

getRefDate : function (component){
    //var referenceDate;
    var refDateMoment;

    if (component.get("v.referenceDateString")){ 
    	refDateMoment = moment(component.get("v.referenceDateString"), "MM-DD-YYYY");
    } else {
    	refDateMoment = moment();
    }


    /*
    if (component.get("v.superPeriod") !== 'NONE'){
      //referenceDate = refDateMoment.startOf(component.get("v.superPeriod")).toDate();
      return refDateMoment.startOf(component.get("v.superPeriod")).toDate();

    } else {
      //referenceDate = refDateMoment.startOf(component.get("v.period")).toDate();        
      return refDateMoment.startOf(component.get("v.period")).toDate();        
  }*/
  return refDateMoment.startOf(component.get("v.period")).toDate();  
},

makeTodayLine : function (component){
  var headerAdder;

  if (component.get("v.outerGrouping") && component.get("v.innerGrouping")){
    headerAdder = 14;
  } else if (component.get("v.outerGrouping") || component.get("v.innerGrouping")){
    headerAdder = 7;
  } else {
    headerAdder = 0
  }

  var dayCount = component.get("v.dayCount");

  //virtual to adjust for the size of the left headers on each row
  var virtualDayCount = dayCount / (1 - (headerAdder/100));

  var todayLeft = _.round(
    moment().diff(moment(component.get("v.referenceDate")), 'days') / virtualDayCount *100
  , 2) + headerAdder;
  
  return todayLeft.toString();

},

makePeriodArray : function(component){    

	
	var periodType = component.get("v.period");
	var superPeriodType = component.get("v.superPeriod");
	var inputPeriodCount = component.get("v.inputPeriodCount")*1-1;

	var referenceDate = this.getRefDate(component);
	component.set("v.referenceDate", referenceDate);
	
    //console.log(referenceDate);
    
    var endDate = moment(referenceDate).add(inputPeriodCount, periodType+'s').endOf(periodType).toDate();
    //console.log("original enddate");
    //console.log(endDate);
    
    var dayCount = moment(endDate).diff(moment(referenceDate), 'days');
    
    

    //console.log(dayCount);
    component.set('v.dayCount', dayCount);
    component.set("v.todayLineLeft", this.makeTodayLine(component));

    var periodArray = {
    	superPeriods : this.subArray(referenceDate, superPeriodType, endDate, dayCount, component.get("v.superPeriodLabelFormat")),
    	periods: this.subArray(referenceDate, periodType, endDate, dayCount, component.get("v.periodLabelFormat"))
    };
    //periodArray.periods = this.subArray(referenceDate, periodType, endDate, dayCount, component.get("v.periodLabelFormat"));
    //periodArray.superPeriods = this.subArray(referenceDate, superPeriodType, endDate, dayCount, component.get("v.superPeriodLabelFormat"));
    
    console.log(periodArray);
    return periodArray;
},

CSL2Array: function (CSL){        
	try{
		var outputArray = CSL.split(",");
		_.forEach(outputArray, function (value, key){
			outputArray[key] = _.trim(value);
		});
		return outputArray;
	} catch(err){            
		return [];
	}
}

})