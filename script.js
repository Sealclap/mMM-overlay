const onesNoBoostBgPath = './assets/ones/1s_noboost.png';
const onesBoostBgPath = './assets/ones/1s_boost.png';
const twosNoBoostBgPath = './assets/twos/2s_noboost.png';
const twosBoostBgPath = './assets/twos/2s_boost.png';
const threesNoBoostBgPath = './assets/threes/3s_noboost.png';
const threesBoostBgPath = './assets/threes/3s_boost.png';

const WsSubscribers = {
  __subscribers: {},
  webSocket: undefined,
  webSocketConnected: false,
  registerQueue: [],
  init: function(port, debug, debugFilters) {
    port = port || 49322;
    debug = debug || false;
    if (debug) {
      if (debugFilters !== undefined) {
        console.warn("WebSocket Debug Mode enabled with filtering. Only events not in the filter list will be dumped");
      } else {
        console.warn("WebSocket Debug Mode enabled without filters applied. All events will be dumped");
        console.warn("To use filters, pass in an array of 'channel:event' strings to the second parameter of the init function");
      }
    }
    WsSubscribers.webSocket = new WebSocket("ws://localhost:" + port);
    WsSubscribers.webSocket.onmessage = function (event) {
      let jEvent = JSON.parse(event.data);
      if (!jEvent.hasOwnProperty('event')) {
        return;
      }
      let eventSplit = jEvent.event.split(":");
      let channel = eventSplit[0];
      let event_event = eventSplit[1];
      if (debug) {
        if (!debugFilters) {
          console.log(channel, event_event, jEvent);
        } else if (debugFilters && debugFilters.indexOf(jEvent.event) < 0) {
          console.log(channel, event_event, jEvent);
        }
      }
      WsSubscribers.triggerSubscribers(channel, event_event, jEvent.data);
    }
    WsSubscribers.webSocket.onopen = function () {
      WsSubscribers.triggerSubscribers("ws", "open");
      WsSubscribers.webSocketConnected = true;
      WsSubscribers.registerQueue.forEach((r) => {
        WsSubscribers.send("wsRelay", "register", r);
      });
      WsSubscribers.registerQueue = [];
    }
    WsSubscribers.webSocket.onerror = function () {
      WsSubscribers.triggerSubscribers("ws", "error");
      WsSubscribers.webSocketConnected = false;
    }
    WsSubscribers.webSocket.onclose = function () {
      WsSubscribers.triggerSubscribers("ws", "close");
      WsSubscribers.webSocketConnected = false;
    }
  },
  /**
   * Add callbacks for when certain events are thrown
   * Execution is guaranteed to be in First In First Out order
   * @param channels
   * @param events
   * @param callback
   */
  subscribe: function(channels, events, callback) {
    if (typeof channels === "string") {
      let channel = channels;
      channels = [];
      channels.push(channel);
    }
    if (typeof events === "string") {
      let event = events;
      events = [];
      events.push(event);
    }
    channels.forEach(function (c) {
      events.forEach(function (e) {
        if (!WsSubscribers.__subscribers.hasOwnProperty(c)) {
          WsSubscribers.__subscribers[c] = {};
        }
        if (!WsSubscribers.__subscribers[c].hasOwnProperty(e)) {
          WsSubscribers.__subscribers[c][e] = [];
          if (WsSubscribers.webSocketConnected) {
            WsSubscribers.send("wsRelay", "register", `${c}:${e}`);
          } else {
            WsSubscribers.registerQueue.push(`${c}:${e}`)
          }
        }
        WsSubscribers.__subscribers[c][e].push(callback);
      });
    });
  },
  clearEventCallbacks: function (channel, event) {
    if (WsSubscribers.__subscribers.hasOwnProperty(channel) && WsSubscribers.__subscribers[channel].hasOwnProperty(event)) {
      WsSubscribers.__subscribers[channel] = {};
    }
  },
  triggerSubscribers: function (channel, event, data) {
    if (WsSubscribers.__subscribers.hasOwnProperty(channel) && WsSubscribers.__subscribers[channel].hasOwnProperty(event)) {
      WsSubscribers.__subscribers[channel][event].forEach(function (callback) {
        if (callback instanceof Function) {
          callback(data);
        }
      });
    }
  },
  send: function (channel, event, data) {
    if (typeof channel !== "string") {
      console.error("Channel must be a string");
      return;
    }
    if (typeof event !== "string") {
      console.error("Event must be a string");
      return;
    }
    if (channel === "local") {
      this.triggerSubscribers(channel, event, data);
    } else {
      let cEvent = channel + ":" + event;
      WsSubscribers.webSocket.send(JSON.stringify({
        "event": cEvent,
        "data": data
      }));
    }
  }
}

let isReplay = false;
let isStarted = false;

$(".replay #replay-vid").css({ "visibility": "hidden" });

$(".game-count").empty();
$(".game-count").append(`<span>Game ${gameNum}</span>`);

$(() => {
  WsSubscribers.init(49322, true);
  WsSubscribers.subscribe("game", "update_state", (d) => {
    $(".scoreboard").empty();
    $(".blue-hdr").empty();
    $(".orange-hdr").empty();
    $(".selected").empty();
    // if (!isReplay){
    //   $(".selected").empty();
    // } else {
    //   $(".selected").css({ "background-color": "rgba(0,0,0,0)", "border": "none" });
    // }
    $(".sel-boost-num").empty();
    $(".svg .circle").css({ "stroke": "none" });
    
    $(".game-count").empty();
    $(".game-count").append(`<span>Game ${gameNum}</span>`);
    
    $(".blue-hdr").append(`<p>${d["game"]["teams"][0]["name"]}`);
    $(".orange-hdr").append(`<p>${d["game"]["teams"][1]["name"]}`);
    
    const hasTarget = d["game"]["hasTarget"];
    const teamSize = Object.keys(d["players"]).length / 2;
    
    let time_seconds = d["game"]["time_seconds"];
    let blueScore = d["game"]["teams"][0]["score"];
    let orangeScore = d["game"]["teams"][1]["score"];
    if (d["game"]["isOT"]) {
      timeString = "Golden Goal";
      $('.scoreboard').append(`<p class="blue-score">${blueScore}</p><p class="time">Golden Goal</p><p class="orange-score">${orangeScore}</p>`);
      $('.scoreboard .time').css({ "font-size": "18px", "padding-top": "10px" });
    } else {
      $('.scoreboard').append(`<p class="blue-score">${blueScore}</p><p class="time">${Math.floor(time_seconds / 60)}:${(time_seconds % 60).toLocaleString('en-us', {minimumIntegerDigits: 2, useGrouping: false})}</p><p class="orange-score">${orangeScore}</p>`);
    }
    
    
    if (isStarted) {
      if (!isReplay) {
        $('.replay #replay-vid').css({ "visibility": "hidden" });
      } else {
        $('.replay #replay-vid').css({ "visibility": "visible" });
      }
      
      if (teamSize === 1) {
        if (hasTarget) {
          $(".main").css({ "background-image": `url(${onesBoostBgPath})` })
        } else {
          $(".main").css({ "background-image": `url(${onesNoBoostBgPath})` });
        }
      } else if (teamSize === 2) {
        if (hasTarget) {
          $(".main").css({ "background-image": `url(${twosBoostBgPath})` });
        } else {
          $(".main").css({ "background-image": `url(${twosNoBoostBgPath})` });
        }
      } else if (teamSize === 3) {
        if (hasTarget) {
          $(".main").css({ "background-image": `url(${threesBoostBgPath})` });
        } else {
          $(".main").css({ "background-image": `url(${threesNoBoostBgPath})` });
        }
      }

      if (hasTarget) {
        const target = d["game"]["target"];
        $(".selected").append(`<p>${d["players"][target]["name"]}</p>`).css({ "background-image": "url('./assets/name_banner.png')"});
      } else if (!hasTarget && !isReplay) {
        $(".selected").css({ "background-image": "none" });
      }
    }

    // if (isStarted && !isReplay) { 
    //   if (d["game"]["hasTarget"]) {
    //     let target = d["game"]["target"];
    //     $(".selected").append(`<p class="watching">Now watching</p><p>${d["players"][target]["name"]}</p>`);
    //     if (d["players"][target]["team"] === 0) {
    //       $(".selected").css({ "background-color": "rgba(45,178,182,0.8)", "border": "1px solid white"});
    //     } else {
    //       $(".selected").css({ "background-color": "rgba(204,153,51,0.8)", "border": "1px solid white"});
    //     }
    //     $(".main").css({ "background-image": "url('./mmm_bg.png')" })
    //   } else if (!d["game"]["hasTarget"] && !isReplay) {
    //     $(".main").css({ "background-image": "url('./no_boost_gauge.png')" });
    //     $(".selected").css({ "background-color": "none", "border": "none" });
    //   }
      
        $(".blue-players").empty();
        $(".orange-players").empty();
      
      
        for (let player of Object.values(d["players"])) {
        let pData = "<div class='player " + player["name"] + "'><p>" + player["name"] + "</p><p class='progress-" + player["name"] + "'></p></div>"
      
        if (player["team"] === 0) {
          $(".blue-players").append(pData);
        } else if (player["team"] === 1) {
          $(".orange-players").append(pData);
        }
      }
    
      for (let player of Object.values(d["players"])) {
        if (player["team"] === 0) { // #DADA1A99
          $(`.blue-players .${player["name"]} .progress-${player["name"]}`).css({
            "background-color": "#DADA1A99",
            "width": `${player["boost"]}%`,
            "height": "8px",
            "border-radius": "1em"
          });
          // $(`.blue-players .${player["name"]} .progress-${player["name"]}`).progressbar({ "value": 0 });
          // $(`.blue-players .${player["name"]} .progress-${player["name"]}`).progressbar("value", player["boost"]);
          // $(`.blue-players .${player["name"]} .progress-${player["name"]} > p`).css({ "background": "#DADA1A99", "height": "12px", "margin": 0 });
          // $(`.blue-players .${player["name"]} .progress-${player["name"]}`).css({ "background": "#00000000", "height": "12px" });
        } else if (player["team"] === 1) { // #DADA1A99
          $(`.orange-players .${player["name"]} .progress-${player["name"]}`).css({
            "background-color": "#DADA1A99",
            "width": `${player["boost"]}%`,
            "height": "8px",
            "border-radius": "1em"
          });
          // $(`.orange-players .${player["name"]} .progress-${player["name"]}`).progressbar({ "value": 0 });
          // $(`.orange-players .${player["name"]} .progress-${player["name"]}`).progressbar("value", player["boost"]);
          // $(`.orange-players .${player["name"]} .progress-${player["name"]} > p`).css({ "background": "#DADA1A99", "height": "12px", "margin": 0 });
          // $(`.orange-players .${player["name"]} .progress-${player["name"]}`).css({ "background": "#00000000", "height": "12px", "transform": "rotate(180deg)" });
        }
      
        if (d["game"]["target"] === player["id"]) {
          $(".sel-boost .outer .inner .sel-boost-num").append(player["boost"]);
          if (player["boost"] === 0) {
            $(".svg .circle").css({ "stroke": "none" });
          } else {
            $(".svg .circle").css({ "stroke": "#eec02e", "stroke-dashoffset": `${222 + (222 * (1 - player["boost"] / 100))}` });
          }
        }
      }
  });

  WsSubscribers.subscribe("game", "pre_countdown_begin", () => {
    isStarted = true;
  });
  
  WsSubscribers.subscribe("game", "replay_start", () => {
    $(".replay #replay-vid").css({ "visibility": "visible" }).load();
    isReplay = true;
  }); 

  WsSubscribers.subscribe("game", "replay_end", () => {
    $(".replay #replay-vid").css({ "visibility": "hidden" });
    isReplay = false;
  });

  WsSubscribers.subscribe("game", "match_ended", () => {
    $(".blue-players").empty();
    $(".orange-players").empty();
    $(".main").css({ "background-image": "url('./assets/scoreboard_only.png')" });
    $(".svg .circle").css({ "stroke": "none" });
    isStarted = false;
  });

  WsSubscribers.subscribe("game", "match_destroyed", () => {
    $(".scoreboard").empty();
    $(".blue-hdr").empty();
    $(".orange-hdr").empty();
    $(".selected").empty();
    $(".sel-boost-num").empty();
    $(".blue-players").empty();
    $(".orange-players").empty();
    $(".svg .circle").css({ "stroke": "none" });
    $(".main").css({ "background-image": "url('./assets/scoreboard_only.png')" });
    isStarted = false;
  });
});