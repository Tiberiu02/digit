var b = false;
var x, y;

var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

var points = [];
var derivative = [];
var d = 0;
var a = 0;
var x1;
var scale;

var minX, minY, maxX, maxY;

function mouseDown(e) {
    document.getElementById("s").innerHTML = "I think it's a ..."

    points = [];
    derivative = [];

    ctx.clearRect(0, 0, 300, 300);

    maxX = minX = x = e.clientX;
    maxY = minY = y = e.clientY;
    b = 1;
    d = -1;

    points.push([x, y]);
}


function mouseRelease() {
    b = 0;
    var d = Math.max(maxY - minY, maxX - minY);
    scale = 100 / d;

    derivative = depeek(derivative, d / 40, 20);
    derivative = depeek(derivative, d / 40, 20);
    derivative = smooth(derivative, 5 * scale);
    derivative = adjust(derivative, 5 * scale);

    for (var i = 0; i < 100; i++) {
        derivative = smooth(derivative, 10 * scale);
        derivative = depeek(derivative, 20, 20 * scale);
    }

    var s = splitVectorIntoSegments(derivative);
    var digit = classify(s, derivative, points);

    if (digit != undefined)
        document.getElementById("s").innerHTML = "I think it's a " + digit + "!";
    else
        document.getElementById("s").innerHTML = "I don't recognize any pattern, can you draw it again?";
}

function compareArray(a, b) {
    if (a.length != b.length)
        return false;
    for (var i = 0; i < a.length; i++)
        if (a[i] != b[i])
            return false;
    return true;
}

function classify(seg, d, p) {
    console.log(seg);

    if (compareArray(seg, [1]) || compareArray(seg, [-1])) {
        var a = 0;
        for (var i = 0; i < p.length; i++)
            a += dist(p[i][0] - p[0][0], p[i][1] - p[0][1]);

        var b = 0;
        for (var i = 0; i < p.length; i++)
            b += dist(p[i][0] - p[p.length - 1][0], p[i][1] - p[p.length - 1][1]);

        var farthest = 0;
        for (var i = 1; i < p.length; i++)
            if (dist(p[0][0] - p[i][0], p[0][1] - p[i][1]) > dist(p[0][0] - p[farthest][0], p[0][1] - p[farthest][1]))
                farthest = i;

        if (dist(p[0][0] - p[p.length - 1][0], p[0][1] - p[p.length - 1][1]) < dist(p[0][0] - p[farthest][0], p[0][1] - p[farthest][1]) / 4)
            return 0;

        var pa = (a < b ? p[0] : p[p.length - 1]);
        var pb = (a > b ? p[0] : p[p.length - 1]);

        return (pa[1] < pb[1] ? 9 : 6);
    } else if (compareArray(seg, [0, 0]))
        return (Math.abs(d[20] - 285) / 3 < Math.abs(d[d.length - 20] - 275) ? 7 : 1);
    else if (compareArray(seg, [1, 0]) || compareArray(seg, [0, -1]) || compareArray(seg, [1, 0, 0]) || compareArray(seg, [0, 0, -1]))
        return 2;
    else if (compareArray(seg, [1, 1]) || compareArray(seg, [-1, -1]))
        return 3;
    else if (compareArray(seg, [0, 0, 0]))
        return 4;
    else if (compareArray(seg, [0, 0, 1]) || compareArray(seg, [-1, 0, 0]))
        return 5;
    else if (compareArray(seg, [0, 0]))
        return 7;
    else if (compareArray(seg, [-1, 0]) || compareArray(seg, [-1, 0, 0]))
        return 9;
    else if (compareArray(seg, [-1, 1]) || compareArray(seg, [1, -1])) {
        var farthest = 0;
        for (var i = 1; i < p.length; i++)
            if (dist(p[0][0] - p[i][0], p[0][1] - p[i][1]) > dist(p[0][0] - p[farthest][0], p[0][1] - p[farthest][1]))
                farthest = i;
        var h;
        var j = 0;
        for (var i = 2; i < d.length; i++) {
            if (Math.abs(d[i] - d[i - 1] - (d[i - 1] - d[i - 2])) > 2) {
                if (i - j > d.length / 8) {
                    h = i;
                    break;
                }
                j = i;
                i++;
            }
        }

        if (dist(p[0][0] - p[h][0], p[0][1] - p[h][1]) < dist(p[0][0] - p[farthest][0], p[0][1] - p[farthest][1] / 8))
            return 9;
        else
            return 5;
    } else {
        var m = 0;
        for (var i = 5; i < d.length - 5; i++)
            m += (d[i] > d[i - 1] && d[i] > d[i + 1] || d[i] < d[i + 1] && d[i] < d[i - 1]);

        if (m == 2)
            return 8;
        else if (m == 0)
            return 1;
        else {
            var farthest = 0;
            for (var i = 1; i < p.length; i++)
                if (dist(p[0][0] - p[i][0], p[0][1] - p[i][1]) > dist(p[0][0] - p[farthest][0], p[0][1] - p[farthest][1]))
                    farthest = i;
            if (farthest >= p.length * 3 / 4)
                return 1;
            if (m == 1 && dist(p[0][0] - p[p.length - 1][0], p[0][1] - p[p.length - 1][1]) < dist(p[0][0] - p[farthest][0], p[0][1] - p[farthest][1] / 8))
                return 8;
        }
    }
}

function cmp(a, b, x) {
    if (x == undefined)
        x = 8;
    if (Math.abs(a - b) <= x * scale)
        return 0;
    else if (a < b)
        return -1;
    else
        return 1;
}

function splitVectorIntoSegments(v) {
    var s = [];
    var j = 0;
    for (var i = 2; i < v.length; i++) {
        if (Math.abs(Math.abs(v[i] - v[i - 5]) - Math.abs(v[i - 5] - v[i - 10])) > 2 * scale) {
            if (i - j > v.length / 8)
                s.push(cmp(v[j + 5], v[i - 5]));
            j = i;
            i++;
        }
    }
    if (v.length - 1 - j > v.length / 10)
        s.push(cmp(v[j] / (v.length - j), v[v.length - 1] / (v.length - j), 0.4 * scale));
    return s;
}

function dist(dx, dy) {
    return dx * dx + dy * dy;
}

function mouseMove(e) {
    x = e.clientX;
    y = e.clientY;

    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);

    if (b == 0 || dist(points[points.length - 1][0] - x, points[points.length - 1][1] - y) < 2) {
        return;
    }

    if (b == 1 && points.length >= 1) {
        var ox = points[points.length - 1][0];
        var oy = points[points.length - 1][1];

        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.closePath();

        a = Math.atan2(ox - x, oy - y) / Math.PI * 25 + 300;

        derivative.push(a);

        d++;

    }
    points.push([x, y]);
}

function depeek(v, k, err) {
    var s = [];
    var i;
    for (i = 0; i < v.length; i++) {
        s.push(v[i]);
        var j = 1;
        while (i + j < v.length && Math.abs(v[i] - v[i + j]) > err && j < k)
            j++;
        if (j < k && i + j < v.length)
            for (; j > 1; j--, i++)
                s.push(v[i]);
    }
    return s;
}

function smooth(v, err) {
    var r = [];
    for (var i = 0; i < v.length; i++) {
        var s = 0;
        var d = 0;
        var c = 1;

        for (var j = 0; i - j >= 0 && i + j < v.length && Math.abs(v[i] - v[i - j]) <= err && Math.abs(v[i] - v[i + j]) <= err; j++) {
            s += (v[i - j] + v[i + j]) * c;
            d += 2 * c;
            c /= 2;
        }

        r.push(s / d);
    }

    return r;
}

function adjust(v, err) {
    var t = [];
    t.push(v[0]);
    for (var i = 1; i < v.length; i++) {
        var l = t[i - 1];
        var a = v[i];
        while (Math.abs(a - l) > Math.abs(a + 50 - l))
            a += 50;
        while (Math.abs(a - l) > Math.abs(a - 50 - l))
            a -= 50;
        t.push(a);
    }
    return t;
}
