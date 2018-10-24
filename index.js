"use strict";

// 25
//18.5

var AWS = require('aws-sdk');
var Alexa = require("alexa-sdk");
//var lambda = new AWS.Lambda();
var dynamoDb = new AWS.DynamoDB.DocumentClient();
var uuid = require('uuid');
//var Speech = require('ssml-builder');
var day_diff,time_diff,table,Ans, Name, Age, Height, Weight, Gender, BMI, unqId, meal, Day_Variable, Meal_Variable, Curr_Date, Curr_Time, Points;
const listOfMeals = ['before breakfast', 'breakfast', 'pre lunch', 'lunch', 'snacks', 'dinner'];

var handlers = {
  'LaunchRequest': function() {
    this.response.speak("Hello, Welcome to health planner. If you have already registered, say 'Alexa, ask health planner for my meal'. If you have not registered, say 'Alexa, tell health planner to register me'").listen("Are you registered?");
    this.emit(":responseReady");
  },
  'RegisterIntent': function() {
    if (this.event.request.dialogState !== 'COMPLETED') {
      
      
      if (this.event.request.intent.slots.age.value
                && this.event.request.intent.slots.age.value === "?") {
        const updatedIntent = this.event.request.intent;
        const slotToElicit = 'age';
        const speechOutput = "Sorry, your age must be a number. What is your age?";
        const repromptSpeech = "Sorry, your age must be a number. What is your age?"
        this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech, updatedIntent);         
      }
      else if (this.event.request.intent.slots.height.value
                && this.event.request.intent.slots.height.value === "?") {
        const updatedIntent = this.event.request.intent;
        const slotToElicit = 'height';
        const speechOutput = "Sorry, your height must be a number. What is your height in inches?";
        const repromptSpeech = "Sorry, your height must be a number. What is your height in inches?"
        this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech, updatedIntent);         
      }
      else if (this.event.request.intent.slots.weight.value
                && this.event.request.intent.slots.weight.value === "?") {
        const updatedIntent = this.event.request.intent;
        const slotToElicit = 'weight';
        const speechOutput = "Sorry, your weight must be a number. What is your weight in kilograms?";
        const repromptSpeech = "Sorry, your weight must be a number. What is your weight in kilograms?"
        this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech, updatedIntent);         
      }
      else if (this.event.request.intent.slots.gender.value
                && this.event.request.intent.slots.gender.value !== 'male'
                && this.event.request.intent.slots.gender.value !== 'female') {
        const updatedIntent = this.event.request.intent;
        const slotToElicit = 'gender';
        const speechOutput = "Sorry, gender must be either male or female. What is your gender?";
        const repromptSpeech = "Sorry, gender must be either male or female. What is your gender?"
        this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech, updatedIntent);         
      }
      else {
        this.emit(':delegate');
      }
    }
    else {
      Name = this.event.request.intent.slots.name.value;
      Age = this.event.request.intent.slots.age.value;
      Height = this.event.request.intent.slots.height.value;
      Weight = this.event.request.intent.slots.weight.value;
      Gender = this.event.request.intent.slots.gender.value;
      
      var temp_ID;
      var val = "H2";
      var params = {
        TableName: "Registration",
        Key: {
          HouseID: val
        },
      };
      
      dynamoDb.get(params).promise()
      .then(data => {
        temp_ID = JSON.stringify(data.Item.Current);
        temp_ID = parseInt(temp_ID, 10);
        //this.response.speak("False " + temp_ID);
        //this.emit(':responseReady');
        return temp_ID;
      })
      .then(temp_ID => {
        var date = new Date();
        var dd = date.getDate();
        var mm = date.getMonth() + 1; //January is 0!
        var yyyy = date.getFullYear();
        var hh = date.getHours();
        var mm1 = date.getMinutes();
        var ss = date.getSeconds();
        if (dd < 10) {
          dd = '0' + dd;
        }
        if (mm < 10) {
          mm = '0' + mm;
        }
        mm = JSON.stringify(mm);
        yyyy = JSON.stringify(yyyy);
        date = mm + '/' + dd + '/' + yyyy;
        hh = hh + 5;
        mm1 = mm1 + 30;
        if (mm1 >= 60) {
          mm1 = mm1 % 60;
        }
        if (hh < 10) {
          hh = '0' + hh;
        }
        if (mm1 < 10) {
          mm1 = '0' + mm1;
        }
        if (ss < 10) {
          ss = '0' + ss;
        }
        mm1 = JSON.stringify(mm1);
        var time = hh + ':' + mm1 + ':' + ss;
        BMI = (Weight * 100 * 100) / (Height * Height * 2.54 * 2.54);
        BMI = Number(Math.round(BMI + 'e2') + 'e-2');
        var insertUserParams = {
          TableName: "User",
          Item: {
            id: uuid.v4(),
            UniqueID: temp_ID + 1,
            Name: Name,
            Age: Age,
            Height: Height,
            Weight: Weight,
            Gender: Gender,
            BMI: BMI,
            Meal_Variable: 0,
            Day_Variable: 0,
            Curr_Time: time,
            Curr_Date: date,
            Points: 0
          },
        };

        return insertUserParams;
      })
      .then(insertUserParams => {
        dynamoDb.put(insertUserParams).promise()
          .then(data => {
            var params = {
              TableName: "Registration",
              Item: {
                id: uuid.v4(),
                HouseID: "H2",
                Current: temp_ID + 1
              },
            };
            dynamoDb.put(params).promise()
              .then(data => {
                var str;
                if (BMI < 18.5)
                  str = "Under Weight";
                else if (BMI >= 25)
                  str = "Over Weight";
                else
                  str = "Normal";
                this.response.speak('Registered Successfully. Your unique ID is ' + (temp_ID + 1) + ' . Your BMI is ' + BMI + ' and your BMI tells that you are ' + str);
                this.emit(':responseReady');
              });
          });
      })
      .catch(err => {
        console.log(err);
        this.emit(':tell', 'Failed. Please try again!' + err);
      });
    }
  },
  'AMAZON.CancelIntent': function () {
        this.response.speak('Goodbye!');
        this.emit(':responseReady');
    },
  'AMAZON.HelpIntent': function () {
      const helpMessage = 'Welcome to Health Planner Help. To register yourself on the skill, say, "Alexa, ask health planner to register me.". To know about your meal suggestions, say "Alexa, ask health planner about my meal." You can also specify the particular meal (say, lunch) by saying "Alexa, ask health planner about my lunch."'
      this.response.speak(helpMessage).listen('Do you want to querry more?');
      this.emit(':responseReady');
  },
  'AMAZON.StopIntent' : function() {
      this.response.speak('See you later!');
      this.emit(':responseReady');
  },
  'SessionEndedRequest': function() {
    this.response.speak('Goodbye and take care!');
    this.emit(':responseReady');
  },
  'GetMealIntent': function() {
    if (this.event.request.dialogState !== 'COMPLETED') {
      if (!this.event.request.intent.slots.uniqueid.value) {
        const updatedIntent = this.event.request.intent;
        const slotToElicit = 'uniqueid';
        const speechOutput = 'What is your unique ID?';
        const repromptSpeech = 'What is your unique ID?';
        this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech, updatedIntent);
      }
      else if (this.event.request.intent.slots.uniqueid.value 
                && this.event.request.intent.slots.uniqueid.value === "?") {
        const updatedIntent = this.event.request.intent;
        const slotToElicit = 'uniqueid';
        const speechOutput = 'Sorry, unique ID must be a number. What is your unique ID?';
        const repromptSpeech = 'Sorry, unique ID must be a number. What is your unique ID?';
        this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech, updatedIntent);          
      }
      else if (!this.event.request.intent.slots.samplemeal.value) {
        unqId = this.event.request.intent.slots.uniqueid.value;
        var params = {
          TableName: "User",
          Key: {
            UniqueID: parseInt(unqId,10)
          },
        };
    
        dynamoDb.get(params).promise()
          .then(data => {
            //this.emit(':tell',"HElllllloooooo");
            Name = data.Item.Name;
            Age = data.Item.Age;
            Weight = data.Item.Weight;
            Height = data.Item.Height;
            Gender = data.Item.Gender;
            BMI = data.Item.BMI;
            Curr_Date = data.Item.Curr_Date;
            Curr_Time = data.Item.Curr_Time;
            Meal_Variable = data.Item.Meal_Variable;
            Day_Variable = data.Item.Day_Variable;
            Points = data.Item.Points;
            if(BMI<18.5)
              table = "Under_Weight";
            else if(BMI>25)
              table = "Over_Weight_Week1";
            else  
              table = "Normal_Weight";
            
            const updatedIntent = this.event.request.intent;
            const slotToElicit = 'samplemeal';
            const speechOutput = 'Which meal do you want to have? Choose one from ' + listOfMeals;
            const repromptSpeech = 'Choose a meal from ' + listOfMeals;
            this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech, updatedIntent);
          })
          .catch(err => {
            console.log(err);
            const updatedIntent = this.event.request.intent;
            const slotToElicit = 'uniqueid';
            const speechOutput = 'Sorry, the unique ID you provided is invalid. What is your unique ID?';
            const repromptSpeech = 'Sorry, the unique ID you provided is invalid. What is your unique ID?';
            this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech, updatedIntent);
          });
        
      }
      else if (this.event.request.intent.slots.samplemeal.value
                && !listOfMeals.includes(this.event.request.intent.slots.samplemeal.value)) {
        const updatedIntent = this.event.request.intent;
        const slotToElicit = 'samplemeal';
        const speechOutput = 'You chose an invalid option. Which meal do you want to have? Choose one from ' + listOfMeals;
        const repromptSpeech = 'Choose a meal from ' + listOfMeals;
        this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech, updatedIntent);          
      }
      else if (this.event.request.intent.slots.samplemeal.value
                && listOfMeals.includes(this.event.request.intent.slots.samplemeal.value)) {
        
        unqId = this.event.request.intent.slots.uniqueid.value;
        var params = {
          TableName: "User",
          Key: {
            UniqueID: parseInt(unqId,10)
          },
        };
    
        dynamoDb.get(params).promise()
          .then(data => {
            //this.emit(':tell',"HElllllloooooo");
            Name = data.Item.Name;
            Age = data.Item.Age;
            Weight = data.Item.Weight;
            Height = data.Item.Height;
            Gender = data.Item.Gender;
            BMI = data.Item.BMI;
            Curr_Date = data.Item.Curr_Date;
            Curr_Time = data.Item.Curr_Time;
            Meal_Variable = data.Item.Meal_Variable;
            Day_Variable = data.Item.Day_Variable;
            Points = data.Item.Points;
            if(BMI<18.5)
              table = "Under_Weight";
            else if(BMI>25)
              table = "Over_Weight_Week1";
            else  
              table = "Normal_Weight";
          })
          .then(() => {
            meal = this.event.request.intent.slots.samplemeal.value;
            var date = new Date();
            var dd = date.getDate();
            var mm = date.getMonth() + 1; //January is 0!
            var yyyy = date.getFullYear();
            var hh = date.getHours();
            var mm1 = date.getMinutes();
            var ss = date.getSeconds();
            if (dd < 10) {
              dd = '0' + dd;
            }
            if (mm < 10) {
              mm = '0' + mm;
            }
            mm = JSON.stringify(mm);
            yyyy = JSON.stringify(yyyy);
            date = mm + '/' + dd + '/' + yyyy;
            day_diff = Date.parse(date) - Date.parse(Curr_Date);
            day_diff = Math.floor(day_diff/86400000)-1;
            if(table === "Over_Weight_Week1")
                day_diff=parseInt(day_diff,10);
            else
                day_diff=String(day_diff);
            //this.emit(':tell','Hello   '+ day_diff);
            
            hh = hh + 5 ;
            mm1 = mm1 + 30;
            if (mm1 >= 60) {
              mm1 = mm1 % 60;
            }
            if (hh < 10) {
              hh = '0' + hh;
            }
            if (mm1 < 10) {
              mm1 = '0' + mm1;
            }
            if (ss < 10) {
              ss = '0' + ss;
            }
            //mm1 = JSON.stringify(mm1);
            var time = hh + ':' + mm1 + ':' + ss;
            //this.emit(':tell', time);
            var bb1="07:00:00";
            var bb2="08:00:00";
            var b1="08:30:00";
            var b2="11:30:00";
            var pl1="11:00:00";
            var pl2="12:00:00";
            var l1="13:00:00";
            var l2="14:30:00";
            var s1="17:00:00";
            var s2="18:00:00";
            var d1="20:00:00";
            var d2="21:00:00";
         // this.emit(':tell',day_diff);
         if(day_diff>28)
         {
            var streak = Points*100/(28*6);
            streak = Number(Math.round(streak + 'e2') + 'e-2');
            this.response.speak('You have completed 4 weeks course with a streak percentage of ' + streak + ' . To continue, say "Alexa, I want to continue."').listen('If you want to continue, say "Alexa, I want to continue."');
            this.emit(':responseReady');
         }
         else if(day_diff<1)
         {
            this.response.speak('You should start from tomorrow.');
            this.emit(':responseReady');
         }
         else if(table !== 'Normal_Weight'){
          var askingMeal = {
            TableName: table,
            Key: {
              Day_Number: day_diff,
            },
          };
          dynamoDb.get(askingMeal).promise()
            .then(data => {
              //this.emit(':tell', JSON.stringify(data));
              var food = "Not Applicable";
              if ((meal === 'before breakfast' || meal === 'Before Breakfast') && time>=bb1 && time<=bb2)
                food = JSON.stringify(data.Item.Before_Breakfast);
              else if ((meal === 'breakfast' || meal === 'Breakfast') && time>=b1 && time<=b2)
                food = JSON.stringify(data.Item.Breakfast);
              else if ((meal === 'lunch' || meal === 'Lunch') && time>=l1 && time<=l2)
                food = JSON.stringify(data.Item.Lunch);
              else if ((meal === 'Snacks' || meal === 'snacks') && time>=s1 && time<=s2)
                food = JSON.stringify(data.Item.Snacks);
              else if ((meal === 'dinner' || meal === 'Dinner') && time>=d1 && time<=d2)
                food = JSON.stringify(data.Item.Dinner);
              else if ((meal === 'pre lunch' || meal === 'Pre Lunch') && time>=pl1 && time<=pl2)
                food = JSON.stringify(data.Item.Pre_Lunch);
              
              if(food === "Not Applicable")
              {
                  Points=Points-1;
                  if (meal === 'before breakfast' || meal === 'Before Breakfast')
                      this.response.speak('You should not eat your food at this time. Please eat in between 7 AM to 8 AM.');
                  else if (meal === 'breakfast' || meal === 'Breakfast')
                      this.response.speak('You should not eat your food at this time. Please eat in between 8:30 AM to 9:30 AM.');
                  else if (meal === 'lunch' || meal === 'Lunch')
                      this.response.speak('You should not eat your food at this time. Please eat in between 1 PM to 2:30 PM.');
                  else if (meal === 'Snacks' || meal === 'snacks') 
                      this.response.speak('You should not eat your food at this time. Please eat in between 4 PM to 5 PM.');
                  else if (meal === 'dinner' || meal === 'Dinner')
                      this.response.speak('You should not eat your food at this time. Please eat in between 8 PM to 9 PM.');
                  else if (meal === 'pre lunch' || meal === 'Pre Lunch') 
                      this.response.speak('You should not eat your food at this time. Please eat in between 11 AM to 12 PM.');
                  this.emit(':responseReady');
              }
                  return food;
            })
            .then(food => {
             // this.emit(':tell', JSON.stringify(food));
             
              var insertUserParams = {
                TableName: "User",
                Item: {
                  id: uuid.v4(),
                  UniqueID: parseInt(unqId,10),
                  Name: Name,
                  Age: Age,
                  Height: Height,
                  Weight: Weight,
                  Gender: Gender,
                  BMI: BMI,
                  Meal_Variable: Meal_Variable,
                  Day_Variable: Day_Variable,
                  Curr_Time: Curr_Time,
                  Curr_Date: Curr_Date,
                  Points: Points + 1
                },
              };
              //this.emit(':tell',Name);
              dynamoDb.put(insertUserParams).promise()
                .then(data => {
                  if(meal === 'breakfast' || meal === 'Breakfast')
                  {
                      let params = {
                        TableName: "Healthy_Life_Tips",
                        Key: {
                          Day_Number : day_diff
                        },
                      };
                      dynamoDb.get(params).promise()
                      .then(data => {
                      var tip = JSON.stringify(data.Item.Tip);
                      this.response.speak("Tip of the day is. " + tip +" . Your food  is . " + food);
                      this.emit(':responseReady');
                      });
                  }
                  else
                  {
                    this.response.speak("Your food  is . " + food);
                    this.emit(':responseReady');
                  }
                  console.log("Hello");
                })
                .catch(err =>{
                  this.emit(':tell',err);
                });
            })
            .catch(err => {
              console.log(err);
              this.emit(":tell", 'Please try again! ' +err);
            });
         }
         else
         {
           this.response.speak('You are fit. Just continue with what you are doing.');
           this.emit(':responseReady');
         }
          })
          .catch(err => {
            console.log(err);
            this.emit(':tell', 'Please try again, ' + err);
          });
        
    }
    }
    
    
  },
  "ReregisterIntent" : function() {
    
      if (!this.event.request.intent.slots.reweight.value) {
        this.emit(':delegate');
      }
      else if (this.event.request.intent.slots.reweight.value
            && this.event.request.intent.slots.reweight.value === "?") {
        const updatedIntent = this.event.request.intent;
        const slotToElicit = 'reweight';
        const speechOutput = "Sorry, your weight must be a number. What is your weight in kilograms?";
        const repromptSpeech = "Sorry, your weight must be a number. What is your weight in kilograms?"
        this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech, updatedIntent);    
      }
      else if (this.event.request.intent.slots.reweight.value
                && this.event.request.intent.slots.reweight.value !== "?") {
        Weight = this.event.request.intent.slots.reweight.value;
        var date = new Date();
        var dd = date.getDate();
        var mm = date.getMonth() + 1; //January is 0!
        var yyyy = date.getFullYear();
        var hh = date.getHours();
        var mm1 = date.getMinutes();
        var ss = date.getSeconds();
        if (dd < 10) {
          dd = '0' + dd;
        }
        if (mm < 10) {
          mm = '0' + mm;
        }
        mm = JSON.stringify(mm);
        yyyy = JSON.stringify(yyyy);
        date = mm + '/' + dd + '/' + yyyy;
        day_diff = Date.parse(date) - Date.parse(Curr_Date);
        day_diff = Math.floor(day_diff/86400000)-1;
        if(table === "Over_Weight_Week1")
            day_diff=parseInt(day_diff,10);
        else
            day_diff=String(day_diff);
        hh = hh + 5 ;
        mm1 = mm1 + 30;
        if (mm1 >= 60) {
          mm1 = mm1 % 60;
        }
        if (hh < 10) {
          hh = '0' + hh;
        }
        if (mm1 < 10) {
          mm1 = '0' + mm1;
        }
        if (ss < 10) {
          ss = '0' + ss;
        }
        mm1 = JSON.stringify(mm1);
        var time = hh + ':' + mm1 + ':' + ss;
        BMI = (Weight * 100 * 100) / (Height * Height * 2.54 * 2.54);
        BMI = Number(Math.round(BMI + 'e2') + 'e-2');
          var insertUserParams = {
            TableName: "User",
            Item: {
              id: uuid.v4(),
              UniqueID: parseInt(unqId,10),
              Name: Name,
              Age: Age,
              Height: Height,
              Weight: Weight,
              Gender: Gender,
              BMI: BMI,
              Meal_Variable: Meal_Variable,
              Day_Variable: Day_Variable,
              Curr_Time: time,
              Curr_Date: date,
              Points: 0
            },
          };
          dynamoDb.put(insertUserParams).promise()
            .then(data => {
              console.log("Hello");
              this.response.speak("Your weight is " + Weight + '. You can take rest today and start from tomorrow.');
              this.emit(':responseReady');
            })
            .catch(err =>{
              this.emit(':tell',err + Weight + unqId);
            });
      }
      
  }
  
};

exports.handler = function(event, context, callback) {
  var alexa = Alexa.handler(event, context);
  alexa.registerHandlers(handlers);
  alexa.execute();
};

