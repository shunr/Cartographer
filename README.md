# Cartographer

Cartographer creates a simple interface to import, edit, create and export image maps.

## Usage

### HTML
Include cartographer
```html
<head>
    <script src="../dist/cartographer.min.js"></script>
</head>
```
Sample image to start mapping
```html
<body>
    <img id="image" src="test.jpg">
    <map name="map" id="testmap">
        <area shape='rect' coords='470,274,645,491'>
        <area shape='circle' coords='989,309,852,229'>
        <area shape='poly' coords='189,137,200,71,248,162,388,189,232,207,168,291,192,189,78,158'>
    </map>
</body>
```

### Javascript

Cartographer configuration object
```js
var config = {
    imageId: "image",
    mapId: "",
    handleRadius: 4,
};
```

Initialize Cartographer with given configuration
```js
window.onload = function() {
    Cartographer.launch(config);
};
```

Add new rectangle, ```SHIFT``` + click to drag
```js
function rect() {
    Cartographer.newShape("rect");
}
```

Add new polygon map. ```SHIFT``` + click to add/remove vertices
```js
function poly() {  
    Cartographer.newShape("poly");
}
```

Add new circle map, ```SHIFT``` + click to drag
```js
function circle() {     
    Cartographer.newShape("circle");
}
```

Delete highlighted shape
```js
function del() {
    Cartographer.deleteShape();
}
```

Return JSON object of all created shapes
```js
function exportAsJSON() {
    console.log(Cartographer.exportMap("json"));
}
```

Return array of HTML map objects of shapes
```js
function exportAsMap() {
    console.log(Cartographer.exportMap("map"));
}
```

Import and edit existing map based on id
```js
function importMap() {
    Cartographer.importMap("testmap");
}
```

Stop/restart cartographer on new image
```js
function stop() {
    Cartographer.stop();
}

function restart() {
    Cartographer.launch(config);
}
```