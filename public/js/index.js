"use strict";

$(document).ready(function(){

  $(function(){
    var today = new Date();
    today.setDate(today.getDate());
    $('#datepicker').datepicker({
      format: "dd/mm/yyyy",
      startDate: today,
      autoclose: true
    });
  });

  $.get("/login",function(data,status){
    if(data != false){
      var arr = data.split(",");
      loginProcess(arr[0],arr[1]);
    } else{
      loginProcess(null,null);
    }
  });

  $("#reservation-form").on("submit",function(event){
    event.preventDefault();
    if(localStorage.getItem("token") != null){
      var date = $("#datepicker").val();
      var hour = $("#hour").val();
      var quarter = $("#quarter").val();
      var size = $("#size").val();
      $("#modal-reservation").text(date+" @"+hour+":"+quarter);
      $("#modal-size").text(size+" people");
        $.get("/people/"+localStorage.getItem("user"),function(user,status){
          $("#modal-name").text(user.forename + " " + user.surname);
          $("#modal-phone").text(user.phone);
        });
      $("#confirmation-modal").modal("show");
    } else{
      alert("You must log in before making a reservation.")
    }
  })

  $("#login-form").submit(function(event){
    event.preventDefault();
    resetLogin();
    var username = $("#username").val();
    var password = $("#password").val();
    $.ajax({
      method: "POST",
      url: "/login",
      data: JSON.stringify({username:username, password:password}),
      contentType: "application/json",
      success: function(data){
        var arr = data.split(",");
        loginProcess(arr[0],arr[1]);
      },
      error: function(err){
        if(err.status == 400){
          $("#loginError").text(err.responseJSON.error);
          document.getElementById("username").style.borderColor = "red";
          document.getElementById("password").style.borderColor = "red";
        } else{
          alert("Unknown exception occurred.")
        }
      }
    });
  });

  $("#register-form").submit(function(event){
    event.preventDefault();
    resetRegister();
    const p1 = $("#register-password1").val();
    const p2 = $("#register-password2").val();
    if(!passwordMatchChecker(p1,p2)){
      $("#passwordError").text("Passwords do not match.");
      document.getElementById("register-password1").style.borderColor = "red";
      document.getElementById("register-password2").style.borderColor = "red";
    } else if(!passwordRequirementChecker(p1)){
      $("#passwordError").text("Password does not meet the minimum requirement.");
      document.getElementById("register-password1").style.borderColor = "red";
      document.getElementById("register-password2").style.borderColor = "red";
    } else{
      var username = $("#register-username").val();
      var forename = $("#register-forename").val();
      var surname = $("#register-surname").val();
      var phone = $("#register-phone").val();
      var email = $("#register-email").val();
      var password = $("#register-password1").val();
      $.ajax({
        method: "POST",
        url: "/people",
        data: JSON.stringify({username: username,forename: forename,surname: surname,phone: phone,email: email,password: password,access_token: "concertina"}),
        contentType: "application/json",
        success: function(data){
          $.ajax({
            method: "POST",
            url: "/login",
            data: JSON.stringify({ username:username, password:password}),
            contentType: "application/json",
            success: function(data){
              var arr = data.split(",")
              loginProcess(arr[0],arr[1]);
            }
          });
        },
        error: function(err){
          if(err.status == 400){
            $("#usernameError").text(err.responseJSON.error);
            document.getElementById("register-username").style.borderColor = "red";
          } else if(err.status == 403){
            alert("You have been logged out due to inactivity.");
            loginProcess(null,null)
            location.reload();
          } else{
            alert("Unknown exception occurred.")
          }
        }
      });
    }
  });

  $("#logout-btn").on("click",function(){
    $.get("/logout",function(data,status){
      loginProcess(null,null);
      alert("You have been successfully logged out.")
    });
  });

  $("#modal-confirm-btn").on("click",function(){
    var date = $("#datepicker").val();
    var hour = $("#hour").val();
    var quarter = $("#quarter").val();
    var size = $("#size").val();
    $.ajax({
      method: "POST",
      url: "/reservation",
      data: JSON.stringify({date: date,time: hour+":"+quarter,size:size,access_token:localStorage.getItem("token")}),
      contentType: "application/json",
      success: function(data){
        $("#confirmation-modal").modal("hide");
        document.getElementById("reservation-form").reset();
      },
      error: function(err){
        if(err.status == 403){
          alert("You have been logged out due to inactivity.");
          loginProcess(null,null)
          location.reload();
        } else{
          alert("Unknown exception occurred.")
        }
      }
    });
  });

  $("#loginDetails").on("click",function(){
    const loginAccount = localStorage.getItem("user");
    $.get("/people/"+loginAccount,function(data,status){
      $("#account-username").text(data.username);
      $("#account-forename").text(data.forename);
      $("#account-surname").text(data.surname);
      $("#account-email").text(data.email);
      $("#account-phone").text(data.phone);
    });
    $.ajax({
      type: "GET",
      url: "/reservation/" + loginAccount,
      data: {access_token: localStorage.getItem("token")},
      contentType: "application/json",
      success: function(data){
        $('#user-reservation-table').bootstrapTable("destroy");
        $('#user-reservation-table').bootstrapTable({
          data: data
        });
        document.getElementById("home").hidden = true;
        document.getElementById("reservation").hidden = true;
        document.getElementById("accountInfo").hidden = false;
      },
      error: function(err){
        if(err.status == 403){
          alert("You have been logged out due to inactivity.");
          loginProcess(null,null)
          location.reload();
        } else{
          alert("Unknown exception occurred.")
        }
      }
    });
  });

  $("#nav-contact, #nav-reservation, #nav-home, #brand").click(function(){
    document.getElementById("home").hidden = false;
    document.getElementById("reservation").hidden = false;
    document.getElementById("accountInfo").hidden = true;
  });

  $("#detail-change-btn").on("click",function(){
    event.preventDefault();
    $.get("/people/"+localStorage.getItem("user"),function(user,status){
      document.getElementById("change-username").value = user.username;
      document.getElementById("change-forename").value = user.forename;
      document.getElementById("change-surname").value = user.surname;
      document.getElementById("change-phone").value = user.phone;
      document.getElementById("change-email").value = user.email;
    });
    $("#detail-change-modal").modal("show");
  });

  $("#detail-change-confirm-btn").on("click",function(){
    event.preventDefault();
    const change_forename = $("#change-forename").val().trim();
    const change_surname = $("#change-surname").val().trim();
    const change_phone = $("#change-phone").val().trim();
    const change_email = $("#change-email").val().trim();
    if(change_forename == "" || change_surname == "" || change_phone == "" || change_email == ""){
      alert("Please do not leave any field blank!");
      return;
    }
    $.ajax({
      url: "/people/change-detail",
      type: "PUT",
      contentType: "application/json",
      data: JSON.stringify({forename: change_forename,
                            surname: change_surname,
                            phone: change_phone,
                            email: change_email,
                            access_token: localStorage.getItem("token")}),
      success: function(data){
        $("#detail-change-modal").modal("hide");
        $("#account-forename").text(change_forename);
        $("#account-surname").text(change_surname);
        $("#account-email").text(change_email);
        $("#account-phone").text(change_phone);
        alert("Your account details changed successfully");
      },
      error: function(err){
        if(err.status == 403){
          alert("You have been logged out due to inactivity.");
          loginProcess(null,null);
          location.reload();
        } else{
          alter("Unknown exception occurred.");
        }
      }
    });
  });

  $("#password-change-btn").on("click",function(){
    event.preventDefault();
    document.getElementById("password-form").reset();
    $("#password-change-modal").modal("show");
  });

  $("#password-change-confirm-btn").on("click",function(){
    event.preventDefault();
    $("#invalid-old-password").text("");
    $("#invalid-new-password").text("");
    document.getElementById("old-password").style.borderColor = "#CED4DA";
    document.getElementById("new-password").style.borderColor = "#CED4DA";
    document.getElementById("new-password-confirm").style.borderColor = "#CED4DA";
    const p0 = $("#old-password").val();
    const p1 = $("#new-password").val();
    const p2 = $("#new-password-confirm").val();
    if(!passwordMatchChecker(p1,p2)){
      $("#invalid-new-password").text("Passwords do not match.");
      document.getElementById("new-password").style.borderColor = "red";
      document.getElementById("new-password-confirm").style.borderColor = "red";
    } else if(!passwordRequirementChecker(p1)){
      $("#invalid-new-password").text("Password does not meet the minimum requirement.");
      document.getElementById("new-password").style.borderColor = "red";
      document.getElementById("new-password-confirm").style.borderColor = "red";
    } else{
      $.ajax({
        url: "/people/change-password",
        type: "PUT",
        contentType: "application/json",
        data: JSON.stringify({old_password: p0,new_password: p1,access_token: localStorage.getItem("token")}),
        success: function(data){
          $("#password-change-modal").modal("hide");
          alert("Your password changed successfully");
        },
        error: function(err){
          if(err.status == 400){
            if(err.responseText.includes("old password")){
              $("#invalid-old-password").text(err.responseJSON.error);
              document.getElementById("old-password").style.borderColor = "red";
            } else{
              $("#invalid-new-password").text(err.responseJSON.error);
              document.getElementById("new-password").style.borderColor = "red";
              document.getElementById("new-password-confirm").style.borderColor = "red";
            }
          } else if(err.status == 403){
            alert("You have been logged out due to inactivity.");
            loginProcess(null,null)
            location.reload();
          } else{
            alter("Unknown exception occurred.");
          }
        }
      });
    }
  });

  $("#remove-reservation-btn").on("click",function(){
    var $table = $("#user-reservation-table");
    if($table.bootstrapTable("getData").length == 0){
      alert("You do not have any reservation.");
      return;
    }
    var ids = $.map($table.bootstrapTable("getSelections"),function(row){
      return row.id;
    });
    if(ids.length == 0){
      alert("Please select at least one reservation to remove.");
      return;
    }
    if(confirm("Are you sure?")){
      var str = "";
      for(var i in ids){
        str += ids[i] + ",";
      }
      str = str.substring(0,str.length-1);
      $.ajax({
        url: "/reservation",
        type: "DELETE",
        data: {ids: str,access_token: localStorage.getItem("token")},
        success: function(){
          $table.bootstrapTable('remove', {
            field: 'id',
            values: ids
          })
        },
        error: function(err){
          if(err.status == 403){
            alert("You have been logged out due to inactivity.");
            loginProcess(null,null);
            location.reload();
          } else{
            alter("Unknown exception occurred.");
          }
        }
      });
    }
  });
});

function passwordMatchChecker(p1,p2){
  if(p1 != p2){
    return false;
  } else{
    return true;
  }
}

function passwordRequirementChecker(p){
  if(p.length < 8){
    return false;
  } else{
    return true;
  }
}

function reservationChecker(){
  var today = new Date();
  var yyyy = today.getFullYear();
  var mm = today.getMonth();
  var dd = today.getDate();

  var select = $("#datepicker").val().split("/");
  var y = select[2];
  var m = select[1];
  var d = select[0];

  if(yyyy == y){
    if(mm == m){
      if(dd == d){
        var hour = today.getHours();
        var h = $
      }
    }
  }
}

function loginProcess(username,token){
  if(username == null && token == null){
    localStorage.clear();
    reset();
    document.getElementById("home").hidden = false;
    document.getElementById("reservation").hidden = false;
    document.getElementById("accountInfo").hidden = true;
    document.getElementById("register-btn").hidden = false;
    document.getElementById("login-btn").hidden = false;
    document.getElementById("loginDetails").hidden = true;
    document.getElementById("logout-btn").hidden = true;
  } else if(username == "admin"){
    localStorage.setItem("user",username);
    localStorage.setItem("token",token);
    window.location.pathname = '../admin.html';
  } else{
    localStorage.setItem("user",username);
    localStorage.setItem("token",token);
    document.getElementById("register-btn").hidden = true;
    document.getElementById("login-btn").hidden = true;
    document.getElementById("loginDetails").hidden = false;
    document.getElementById("logout-btn").hidden = false;
  }
}

function reset(){
  $("#account-username").text("");
  $("#account-forename").text("");
  $("#account-surname").text("");
  $("#account-email").text("");
  $("#account-phone").text("");
  $("#user-reservation-table").bootstrapTable('destroy');
  resetLogin();
  resetRegister();
  document.getElementById("register-form").reset();
  document.getElementById("login-form").reset();
}

function resetLogin(){
  document.getElementById("username").style.borderColor = "#CED4DA";
  document.getElementById("password").style.borderColor = "#CED4DA";
  $("#loginError").text("");
}

function resetRegister(){
  document.getElementById("register-username").style.borderColor = "#CED4DA";
  document.getElementById("register-password1").style.borderColor = "#CED4DA";
  document.getElementById("register-password2").style.borderColor = "#CED4DA";
  $("#usernameError").text("");
  $("#passwordError").text("");
}
