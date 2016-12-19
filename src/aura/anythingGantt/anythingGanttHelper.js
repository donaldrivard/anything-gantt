({
  runAll : function(component){
        var data = JSON.parse(component.get("v.originalData"));
        console.log("data in RunAll is");
        console.log(data);

        //check filter field values
        data = this.applyFilters(component, data);
        

        this.organizeData(component, data);        
        
        console.log("final data structure");
        console.log(component.get("v.data"));

  },

  applyFilters : function (component, recordList){
    var helper = this;
    var filters = [];

    console.log("preFilter");
    console.log(recordList);
    _.forEach(helper.CSL2Array(component.get("v.filterFields")), function (field){
      var filterValue = component.get("v.filterValues")[field];
      console.log(field + ":" + filterValue);
      if (filterValue !== "Any"){
        recordList = _.filter(recordList, [field , filterValue])
      }      
    });
    console.log("postFilter");
    console.log(recordList);
    

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


    if (extraFieldArray.length>1){
      query = query + ', ' + extraFieldArray.join();
    }
    //base
    query = query + " from " + component.get("v.objectName") + " where " + startDateField + " >= " + moment(refDate).toISOString() // + " and " + endDateField + " >= " + moment(refDate).toISOString();
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
      if (component.get("v.colorCodeField")){
        newRecord.colorClass = "cc" + _.indexOf(colorCodeArray, record[component.get("v.colorCodeField")]);
      } else {
        //default color if no color coding is requested
        newRecord.colorClass = "slds-theme--inverse";
      }
      newRecord.left = _.round((moment(record[component.get("v.startDateField")]).diff(moment(component.get("v.referenceDate")), 'days')/component.get("v.dayCount")*100), 3).toString();
      newRecord.width = _.round((moment(record[component.get("v.endDateField")]).diff(moment(record[component.get("v.startDateField")]), 'days')/component.get("v.dayCount")*100), 3).toString();
      console.log(newRecord.width);
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
      _.forEach(filterFields, function(field, key){
        //filterValues[key] = "Any";
        filterValues[field] = "Any";  

        //build options
        var options = [];
        options.push({
          "class" : optionClass,
          "label" : "--Any--",
          "value" : "Any",
          "selected" : "true"
        });

        _.forEach(_.uniq(_.map(recordList, field)), function(option){
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
    }
  },

  subArray : function(refDate, periodType, endDate, dayCount, format){
  	console.log("subarray output");
  	console.log('refDate');
  	console.log(refDate);
  	console.log('periodType');
  	console.log(periodType);
  	console.log('endDate');
  	console.log(endDate);
  	console.log('dayCount');
  	console.log(dayCount);
  	console.log('format');
  	console.log(format);

    var momentCounter = moment(refDate);
    var output = [];

    do {
      var thisCounter = momentCounter.toDate();
      //console.log(thisCounter);
      
      var startPeriod = moment(thisCounter).startOf(periodType).toDate();
      //console.log(startPeriod);
      
      var endPeriod = moment(thisCounter).endOf(periodType).toDate();
      //console.log(endPeriod);

      var daysInPeriod = Math.min(
        moment(endPeriod).diff(moment(startPeriod), 'days'),
        moment(endDate).diff(moment(startPeriod), 'days') 
      );

      var width = daysInPeriod/dayCount*100;

      output.push({
        "width": daysInPeriod/dayCount*100,
        "label": momentCounter.format(format)
      });
      momentCounter.add(1, periodType+'s');
    } while (momentCounter.isBefore(moment(endDate)));
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

    if (component.get("v.superPeriod") != 'NONE'){
      //referenceDate = refDateMoment.startOf(component.get("v.superPeriod")).toDate();
      return refDateMoment.startOf(component.get("v.superPeriod")).toDate();

    } else {
      //referenceDate = refDateMoment.startOf(component.get("v.period")).toDate();        
      return refDateMoment.startOf(component.get("v.period")).toDate();        
    }
  },

  makePeriodArray : function(component){    

    
    var periodType = component.get("v.period");
    var superPeriodType = component.get("v.superPeriod");
    var inputPeriodCount = component.get("v.inputPeriodCount")*1-1;

    var referenceDate = this.getRefDate(component);
    component.set("v.referenceDate", referenceDate);
    
    //console.log(referenceDate);
    
    var endDate = moment(referenceDate).add(inputPeriodCount, periodType+'s').endOf(periodType).toDate();
    //console.log(endDate);
    
    var dayCount = moment(endDate).diff(moment(referenceDate), 'days');

    //console.log(dayCount);
    component.set('v.dayCount', dayCount);

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