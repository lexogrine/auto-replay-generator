(this["webpackJsonpauto-replay-generator"]=this["webpackJsonpauto-replay-generator"]||[]).push([[0],{10:function(e,n,t){},11:function(e,n,t){},13:function(e,n,t){"use strict";t.r(n);var c=t(1),s=t.n(c),i=t(4),a=t.n(i),r=(t(9),t(10),t(2)),o=(t(11),t(0)),l=window.require("electron").ipcRenderer;var j=function(){var e=Object(c.useState)(!1),n=Object(r.a)(e,2),t=n[0],s=n[1],i=Object(c.useState)(""),a=Object(r.a)(i,2),j=a[0],d=a[1],p=Object(c.useState)(0),u=Object(r.a)(p,2),b=u[0],m=u[1];return Object(c.useEffect)((function(){s(!1),l.on("address",(function(e,n){m(n.port),d(n.ip.split(".").map(Number).map((function(e){return e.toString(16)})).join("-")+"-"+n.port.toString(16))})),l.on("argStatus",(function(e,n){s(n)})),l.on("status",(function(e,n){s(n)})),l.send("getAddress"),l.send("getStatus")}),[]),Object(o.jsxs)("div",{className:"App",children:[Object(o.jsxs)("div",{className:"window-bar",children:[Object(o.jsx)("div",{className:"window-drag-bar",children:Object(o.jsx)("div",{className:"title-bar",children:"Lexogrine Auto Replay Generator"})}),Object(o.jsx)("div",{onClick:function(){l.send("min")},className:"app-control minimize"}),Object(o.jsx)("div",{onClick:function(){l.send("max")},className:"app-control maximize"}),Object(o.jsx)("div",{onClick:function(){l.send("close")},className:"app-control close"})]}),Object(o.jsx)("div",{className:"App-container",children:Object(o.jsxs)("main",{children:[Object(o.jsx)("p",{children:"Lexogrine Auto Replay Generator"}),Object(o.jsxs)("p",{children:["Replayer ID: ",j," (",Object(o.jsx)("span",{className:t?"online":"offline",children:t?"online":"offline"}),")"]}),b?Object(o.jsxs)(o.Fragment,{children:[Object(o.jsx)("p",{children:"Run this command in CS:GO:"}),Object(o.jsxs)("code",{children:['mirv_pgl url "ws://localhost:',b,'"; mirv_pgl start;']})]}):null]})})]})};a.a.render(Object(o.jsx)(s.a.StrictMode,{children:Object(o.jsx)(j,{})}),document.getElementById("root"))}},[[13,1,2]]]);
//# sourceMappingURL=main.0338513b.chunk.js.map