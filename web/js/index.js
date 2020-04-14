var num = 0; //使用数字键输入的数字
var stars = "";  //使用数字键时的密码保护

// ATM对象
var atm = {status: 0}; // 0:空闲 1:关闭 2:处理中
atm.refresh = function refresh(status) {
    this.status = status;
};

// 屏幕对象
var display = {text: ""};
display.refresh = function refresh(text) {
    this.text = text;
    $("#display").html(this.text);
};
display.show = function show(text) {
    $("#display").html(text);
};

// 按钮对象
var switchButton = {text: "", disable: true};
switchButton.refresh = function refresh(text, disable) {
    this.text = text;
    this.disable = disable;
    $("#switch").html(text);
    $("#switch").unbind("click");
    if (atm.status == 0) {
        $("#switch").click(turnoff);
    } else if (atm.status == 1) {
        $("#switch").click(turnon);
    }
    $("#switch").attr('disable', disable);
};

// 插卡孔
var cardSlot = {text: "", inserted: false};
cardSlot.refresh = function refresh(text, inserted) {
    this.text = text;
    this.inserted = inserted;
    $("#card").html(text);
    $("#card").attr('disable', inserted);
};

// 数字按钮
var digitButton = {state: 2, visibility: 0, servletName: ""};
digitButton.refresh = function refresh(state, visibility, servletName) {
    this.state = state;
    this.visibility = visibility;
    this.servletName = servletName;
};

function readNum(obj) {
    var digit = Number(obj.value);
    if (digitButton.state == 0) {
        submitNum(digit);
    } else if (digitButton.state == 1) {
        var str = display.text + "<br/>";
        num = 10 * num + digit;
        //  0:在显示屏显示输入的数字 1:在显示屏显示星号
        if (digitButton.visibility == 1) {
            stars += "*";//叠加
            str += stars;
        } else {
            stars = "";//重置
            str += num;
        }
        display.show(str);
    } else if (digitButton.state == 2) {

    }
}

// 在DOM树加载完成后就会执行
$(document).ready(function () {
    $("#card").click(insertCard);
    getStatus();
});

function refresh(resp) {
    if (typeof (resp.ATM) == "undefined") {
        alert("请选择你的操作，插卡或关机！");
        return false;
    }
    // 更新ATM状态
    atm.refresh(resp.ATM.state);
    // 更新屏幕对象状态
    display.refresh(resp.display.text);
    // 更新按钮对象状态
    switchButton.refresh(resp.switchbutton.text, resp.switchbutton.disable);
    // 更新插卡孔状态
    cardSlot.refresh(resp.cardslot.text, resp.cardslot.inserted);
    // 更新数字按钮状态
    digitButton.refresh(resp.digitbutton.state, resp.digitbutton.visibility, resp.digitbutton.servletName);
}

// 返回当前ATM系统各个对象的状态
function getStatus() {
    $.post('/ATM/GetStatusServlet', function (responseText) {
        refresh(responseText);
    });
}

// 开启ATM
function turnon() {
    $.post('/ATM/TurnOnServlet', function (responseText) {
        refresh(responseText);
    });
}

// 关闭ATM
function turnoff() {
    $.post('/ATM/TurnOffServlet', function (responseText) {
        refresh(responseText);
    });
}

// 插入银行卡
function insertCard() {
    // 账号输入框
    var cardNo = window.prompt("请输入账号", "");
    $.post('/ATM/CardInsertedServlet', 'cardNo=' + cardNo, function (responseText) {
        refresh(responseText);
    });
}

function submitNum(number) {
    $.post('/ATM/' + digitButton.servletName, 'num=' + number, function (responseText) {
        refresh(responseText);
        // 当用户提交后，重置
        num = 0;
        stars = "";
    });
}

function submit() {
    submitNum(num);
}

function cancel() {
    // 用户在输入取款金额过程中、输入存款金额过程中、输入转账账户过程中、输入转账金额、修改密码过程中点击返回按钮时
    if (digitButton.servletName == "WithdrawServlet" ||
        digitButton.servletName == "DepositServlet" ||
        digitButton.servletName == "TransferAccountServlet" ||
        digitButton.servletName == "TransferBalanceServlet" ||
        digitButton.servletName == "UpdatePWDServlet") {
        $.post('/ATM/CancelServlet', function (responseText) {
            refresh(responseText);
        });
    } else {
        // 取消输入密码
        $.post('/ATM/' + digitButton.servletName, 'num=exitATM', function (responseText) {
            refresh(responseText);
        });
    }
}

// 刷新页面
function receiptInfo() {
    window.location.reload();
}

// 当用户关闭或刷新ATM机操作页面时执行
$(function () {
    // 火狐浏览器刷新页面执行，360刷新、关闭都执行
    window.onunload = function () {
        $.post("/ATM/RefreshShutdownSystemServlet");
    };

    // 火狐浏览器关闭页面执行，360刷新、关闭都执行
    window.onbeforeunload = function () {
        $.post("/ATM/RefreshShutdownSystemServlet");
    };
});