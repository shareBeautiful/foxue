function VueTouch(el, binding, type) {
    var g = this;

    g.obj = el;
    g.binding = binding;
    g.touchType = type;

    g.firstTouchPosition = {
        x: 0,
        y: 0
    };
    g.firstTouchTime = 0;
    g.callBack = typeof (binding.value) === "object" ? binding.value.fn : binding.value;

    g.moved = false;
    g.leaved = false;
    g.longTouched = false;

    // 事件监听回调集合
    var _listener = Object.create(null);

    // 事件方法
    var _listen = (type) => {
        return function (e) {
            var {
                stop,
                prevent,
                self,
                once
            } = g.binding.modifiers;

            // 配置判断
            if (stop) e.stopPropagation();
            if (prevent) e.preventDefault();
            if (once) g.obj.removeEventListener("touch" + type, _listener[type]);
            if (self && e.target !== e.currentTarget) return;

            g[type](e);
        }
    };

    _listener.start = _listen('start');
    _listener.end = _listen('end');
    _listener.move = _listen('move');

    this.obj.addEventListener("touchstart", _listener.start, false);
    this.obj.addEventListener("touchend", _listener.end, false);
    this.obj.addEventListener("touchmove", _listener.move, false);
    // vnode.key = this.randomString()

};
VueTouch.prototype = {
    start: function (e) {
        this.d = 20
        var g = this;

        // 初始化点击状态
        g.moved = false;
        g.leaved = false;
        g.longTouched = false;

        g.firstTouchPosition = g.getMultiCenter(e.changedTouches);
        g.firstTouchTime = e.timeStamp;
        g.time = setTimeout(function () {
            if (!g.leaved && !g.moved) {
                g.touchType === "longtap" && g.callBack(e, g.binding.value);
                g.longTouched = true;
            }
        }.bind(g), 1000);
    },
    end: function (e) {
        var g = this;

        var {
            x,
            y
        } = g.getMultiCenter(e.changedTouches);
        var _disX = x - g.firstTouchPosition.x;
        var _disY = y - g.firstTouchPosition.y;
        var _dis = Math.sqrt(_disX * _disX + _disY * _disY);
        var _timeDis = e.timeStamp - g.firstTouchTime;

        clearTimeout(g.time);

        var _angle = this.getAngle(_disX, _disY);

        if (_dis > 20 && _timeDis < 300) {
            g.touchType === "swipe" && g.callBack(e, g.binding.value);
            if (_angle >= 60 && _angle <= 120)
                g.touchType === "swipedown" && g.callBack(e, g.binding.value);
            if (_angle <= -60 && _angle >= -120)
                g.touchType === "swipeup" && g.callBack(e, g.binding.value);
            if (_angle <= 10 && _angle >= -10) // 20,20
                g.touchType === "swiperight" && g.callBack(e, g.binding.value);
            if ((_angle <= -160 && _angle > -180) || (_angle >= 160 && _angle <= 180))
                g.touchType === "swipeleft" && g.callBack(e, g.binding.value);
        } else {
            if (!g.longTouched && !g.moved) {
                g.touchType === "tap" && g.callBack(e, g.binding.value);
                g.leaved = true;
            }
        }
    },
    move: function (e) {
        this.moved = true;
    },

    /**
     * 获取点击集合的中心坐标
     * @param touches touch对象集合
     * @return {{x: number, y: number}}
     */
    getMultiCenter: function (touches) {

        var g = this,
            x = 0,
            y = 0;

        const _length = touches.length;

        for (var i = 0; i < _length; i++) {
            x += touches[i].pageX;
            y += touches[i].pageY;
        }

        return {
            x: Math.round(x / _length),
            y: Math.round(y / _length)
        };
    },

    getAngle: function (disX, disY) {
        var g = this;
        if (typeof disX !== 'number' || typeof disY !== 'number')
            return 45;
        return Math.atan2(disY, disX) * 180 / Math.PI;
    }
};
var eArr = ['tap', 'swipe', 'swipeleft', 'swiperight', 'swipedown', 'swipeup', 'longtap'];
eArr.forEach(function(s) {
    Vue.directive(s, {
        bind: function (el, binding) {
            new VueTouch(el, binding, s);
        }
    });
});