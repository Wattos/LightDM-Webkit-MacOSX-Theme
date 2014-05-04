time_remaining = 0;
selected_user= null;
valid_image=/.*\.(png|svg|jpg|jpeg|bmp)$/i;

///////////////////////////////////////////////
// CALLBACK API. Called by the webkit greeeter
///////////////////////////////////////////////

// called when the greeter asks to show a login prompt for a user
function show_prompt(text) {
  var password_container= document.getElementById("password_container");
  var password_entry= document.getElementById("password_entry");
  if (!isVisible(password_container)) {
    var users= document.getElementsByClassName("user");
    var user_node= document.getElementById(selected_user);
    var rect= user_node.getClientRects()[0];
    var parentRect= user_node.parentElement.getClientRects()[0];
    var center= parentRect.width/2;
    var left= center - rect.width/2 - rect.left;
    if (left < 5 && left > -5) {
      left= 0;
    }
    for (var i= 0; i < users.length; i++) {
      var node= users[i];
      setVisible(node, node.id == selected_user);
      node.style.left= left;
    }

    setVisible(password_container, true);
    password_entry.placeholder= text.replace(":", "");
  }
  password_entry.value= "";
  password_entry.focus();
}

// called when the greeter asks to show a message
function show_message(text) {
  var message= document.getElementById("message_content");
  message.innerHTML= text;
  if (text) {
    document.getElementById("message").classList.remove("hidden");
  } else {
    document.getElementById("message").classList.add("hidden");
  }
  message.classList.remove("error");
}

// called when the greeter asks to show an error
function show_error(text) {
   show_message(text);
   var message= document.getElementById("message_content");
   message.classList.add("error");
   var element = document.getElementById("password_entry");
   element.classList.add("animated");
   element.classList.add("shake");
   window.setTimeout( function(){
                element.classList.remove("animated");
                element.classList.remove("shake");
            }, 1000);
}

// called when the greeter is finished the authentication request
function authentication_complete() {
   if (lightdm.is_authenticated)
       lightdm.login (lightdm.authentication_user, lightdm.default_session);
   else {
       show_error("Authentication Failed");
       start_authentication(selected_user);   
    }
}

// called when the greeter wants us to perform a timed login
function timed_login(user) {
   lightdm.login (lightdm.timed_login_user);
   setTimeout('throbber()', 1000);
}

//////////////////////////////
// Implementation
//////////////////////////////
function start_authentication(username) {
   lightdm.cancel_timed_login();
   selected_user= username;
   lightdm.start_authentication(username);
}

function provide_secret() {
   show_message("Logging in...");
   entry = document.getElementById('password_entry');
   lightdm.provide_secret(entry.value);
}

function show_users() {
  var users= document.getElementsByClassName("user");
  for (var i= 0; i < users.length; i++) {
    setVisible(users[i], true);
    users[i].style.left= 0;
  }
  setVisible(document.getElementById("password_container"), false);
  selected_user= null;
}

function user_clicked(event) {
  if (selected_user != null) {
    selected_user= null;
    lightdm.cancel_authentication();
    show_users();
  } else {
    selected_user= event.currentTarget.id;
    start_authentication(event.currentTarget.id);
  }
  show_message("");
  event.stopPropagation();
  return false;
}

function setVisible(element, visible) {
  if (visible) {
    element.classList.remove("hidden");
  } else {
    element.classList.add("hidden");
  }
}

function isVisible(element) {
  return !element.classList.contains("hidden");
}

function update_time() {
  var time= document.getElementById("current_time");
  var date= new Date();
  
  var hh = date.getHours();
  var mm = date.getMinutes();
  var ss = date.getSeconds();
  var suffix= "AM";
  if (hh > 12) {
    hh= hh - 12;
    suffix= "PM";
  }
  if (hh < 10) {hh = "0"+hh;}
  if (mm < 10) {mm = "0"+mm;}
  if (ss < 10) {ss = "0"+ss;}
  time.innerHTML= hh+":"+mm + " " + suffix;
}

//////////////////////////////////
// Initialization
//////////////////////////////////

function initialize() {
  show_message("");
  initialize_users();
  initialize_actions();
  initialize_timer();
}

function initialize_users() {
  var template= document.getElementById("user_template");
  var parent= template.parentElement;
  parent.removeChild(template);

  for (i in lightdm.users) {
    user= lightdm.users[i];
    userNode= template.cloneNode(true);
    
    var image= userNode.getElementsByClassName("user_image")[0];
    var name= userNode.getElementsByClassName("user_name")[0];
    name.innerHTML= user.display_name;
    
    if (user.image) {
      image.src = user.image
      image.onerror= function(e) {
        e.currentTarget.src= "img/avatar.svg";
      }
    } else {
      image.src = "img/avatar.svg";
    }

    userNode.id= user.name;
    userNode.onclick= user_clicked;
    parent.appendChild(userNode);
  }
  setTimeout(show_users, 400);
}

function initialize_actions() {
  var template= document.getElementById("action_template");
  var parent= template.parentElement;
  parent.removeChild(template);

  if (lightdm.can_suspend) {
    add_action("sleep","Sleep", "img/sleep.svg", function(e) {lightdm.suspend(); e.stopPropagation();}, template, parent);
  }
  if (lightdm.can_restart) {
    add_action("restart", "Restart", "img/restart.svg", function(e) {lightdm.restart(); e.stopPropagation();}, template, parent);
  }
  if (lightdm.can_shutdown) {
    add_action("shutdown", "Shutdown", "img/shutdown.svg", function(e) {lightdm.shutdown(); e.stopPropagation();}, template, parent);
  }
}

function initialize_timer() {
  update_time();
  setInterval(update_time, 1000);
}

function add_action(id, name, image, clickhandler, template, parent) {
  action_node= template.cloneNode(true);
  action_node.id= "action_" + id;
  img_node= action_node.getElementsByClassName("action_image")[0];
  label_node= action_node.getElementsByClassName("action_label")[0];
  label_node.innerHTML= name;
  img_node.src= image;
  action_node.onclick= clickhandler;
  parent.appendChild(action_node);
}
