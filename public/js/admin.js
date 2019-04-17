"use strict"

$(document).ready(function(){

  $('.nav-link').on('click',function() {
    $('.navbar-collapse').collapse('hide');
  });

  $.ajax({
    type: "GET",
    url: "/reservation",
    data: {access_token: localStorage.getItem("token")},
    contentType: "application/json",
    success: function(data){
      var all = getValues(data);
      $('#reservation-table').bootstrapTable({
        data: all
      });
      var todayReservation = getTodayReservation(data)
      $('#today-reservation-table').bootstrapTable({
        data: todayReservation
      });
      $("#today-reservation-number").text(todayReservation.length);
      $("#reservation-number").text(all.length);
    },
    error: function(err){
      if(err.status == 403){
        alert("The request is refused due to long-time inactivity or unauthorized access.");
        window.location.pathname = '';
      } else{
        alert("Unknown exception occurred");
      }
    }
  });

  $.get("/people",function(data,status){
    var all = getValues(data);
    $('#consumer-table').bootstrapTable({
      data: all
    });
    $("#consumer-number").text(all.length);
  });

  $("#logout-btn").on("click",function(){
    $.get("/logout",function(data,status){
      window.location.pathname = '';
      alert("You have been successfully logged out.")
    });
  });

  $(function(){
    var month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    var t = document.getElementById('time');
    var date = document.getElementById('date');

    function time() {
      var d = new Date();
      var yyyy = d.getFullYear();
      var mm = d.getMonth();
      var dd = d.getDate();
      var s = d.getSeconds();
      var m = d.getMinutes();
      var h = d.getHours();
      date.textContent = dd + " " + month[mm] + ", " + yyyy;
      t.textContent = h + ":" + m + ":" + s;
    }

    setInterval(time, 1000);
  });

  $("#consumer-nav, #dash-btn2").on("click",function(){
    document.getElementById("dashboard").hidden = true;
    document.getElementById("consumer").hidden = false;
    document.getElementById("reservation").hidden = true;
  });

  $("#dashboard-nav, #brand").on("click",function(){
    document.getElementById("dashboard").hidden = false;
    document.getElementById("consumer").hidden = true;
    document.getElementById("reservation").hidden = true;
  });

  $("#reservation-nav, #dash-btn1, #dash-btn3").on("click",function(){
    document.getElementById("dashboard").hidden = true;
    document.getElementById("consumer").hidden = true;
    document.getElementById("reservation").hidden = false;
  });
});

function getTodayReservation(reservation){
  var today = new Date();
  var yyyy = today.getFullYear();
  var mm = today.getMonth()+1;
  var dd = today.getDate();
  var temp = Object.values(reservation)
  var result = [];
  for(var i in temp){
    var date = temp[i].date;
    var arr = date.split("/");
    var d = parseInt(arr[0]);
    var m = parseInt(arr[1]);
    var y = parseInt(arr[2]);
    if(dd == d && mm == m && yyyy == y){
      result.push(temp[i]);
    }
  }
  return result;
}

function getValues(dict){
  const keys = Object.keys(dict);
  var values = [];
  for(var i in keys){
    values.push(dict[keys[i]]);
  }
  return values;
}
