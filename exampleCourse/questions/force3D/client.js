
define(["jquery", "THREE", "OrbitControls", "SimpleClient", "text!./question.html", "text!./answer.html"], function($, THREE, OrbitControls, SimpleClient, questionTemplate, answerTemplate) {

    var drawFcn = function() {
        var width = 400;
        var height = 400;
        
        var scene = new THREE.Scene();
        //var camera = new THREE.PerspectiveCamera( 30, width / height, 0.1, 1000 );
        var camera = new THREE.OrthographicCamera(-1.2, 1.2, 1.2, -1.2, 1, 1000);
        
        var renderer = new THREE.WebGLRenderer();
        renderer.setSize(width, height);
        $("#figure1").append(renderer.domElement);


        
        var geometry = new THREE.PlaneGeometry( 1.5, 1.5, 10, 10 );
        var material = new THREE.MeshBasicMaterial( {color: 0x7070f0, side: THREE.DoubleSide} );
        var plane = new THREE.Mesh( geometry, material );
        plane.rotateX(Math.PI/2);
        scene.add( plane );

        var geometry = new THREE.PlaneGeometry( 1.5, 1.5, 10, 10 );
        var material = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide, wireframe: true} );
        var plane = new THREE.Mesh( geometry, material );
        plane.rotateX(Math.PI/2);
        plane.translateZ(-0.01);
        scene.add( plane );


        
        var geometry = new THREE.BoxGeometry( 0.6, 0.6, 0.6 );
        //var material = new THREE.MeshBasicMaterial( { color: 0xa07070 } );
        var material = new THREE.MeshPhongMaterial( { color: 0x555555, specular: 0xffffff, shininess: 5, shading: THREE.FlatShading } );
        var cube = new THREE.Mesh( geometry, material );
        cube.translateX(0.3);
        cube.translateY(0.3);
        cube.translateZ(0.3);
        scene.add( cube );



        var material = new THREE.MeshPhongMaterial( { color: 0x773344, specular: 0xffffff, shininess: 5, shading: THREE.FlatShading } );
        var geometry = new THREE.CylinderGeometry( 0, 0.05, 0.1, 20, 5 );
        var head = new THREE.Mesh( geometry, material );
        scene.add( head );
        var geometry = new THREE.CylinderGeometry( 0.02, 0.02, 2, 20, 5 );
        var shaft = new THREE.Mesh( geometry, material );
        head.translateY(1.05);
        scene.add( shaft );



        var material = new THREE.MeshPhongMaterial( { color: 0x773344, specular: 0xffffff, shininess: 5, shading: THREE.FlatShading } );
        var geometry = new THREE.CylinderGeometry( 0, 0.05, 0.1, 20, 5 );
        var head = new THREE.Mesh( geometry, material );
        scene.add( head );
        var geometry = new THREE.CylinderGeometry( 0.02, 0.02, 2, 20, 5 );
        var shaft = new THREE.Mesh( geometry, material );
        head.translateZ(1.05);
        head.rotateX(Math.PI / 2);
        shaft.rotateX(Math.PI / 2);
        scene.add( shaft );


        
        var material = new THREE.MeshPhongMaterial( { color: 0x773344, specular: 0xffffff, shininess: 5, shading: THREE.FlatShading } );
        var geometry = new THREE.CylinderGeometry( 0, 0.05, 0.1, 20, 5 );
        var head = new THREE.Mesh( geometry, material );
        scene.add( head );
        var geometry = new THREE.CylinderGeometry( 0.02, 0.02, 2, 20, 5 );
        var shaft = new THREE.Mesh( geometry, material );
        head.translateX(1.05);
        head.rotateZ(-Math.PI / 2);
        shaft.rotateZ(Math.PI / 2);
        scene.add( shaft );





        var material = new THREE.MeshPhongMaterial( { color: 0x338844, specular: 0xffffff, shininess: 5, shading: THREE.FlatShading } );
        var geometry = new THREE.CylinderGeometry( 0, 0.05, 0.1, 60, 5 );
        var head = new THREE.Mesh( geometry, material );
        scene.add( head );
        var geometry = new THREE.CylinderGeometry( 0.02, 0.02, Math.sqrt(2) * (0.6 - 0.05), 60, 5 );
        var shaft = new THREE.Mesh( geometry, material );
        head.translateY(0.3);
        head.translateX(-0.3);
        head.rotateZ(3/4 * Math.PI);
        head.translateZ(0.6);
        head.translateY(Math.sqrt(2) * (0.3 - 0.055));

        shaft.translateY(0.325);
        shaft.translateX(-0.275);
        shaft.rotateZ(-1/4 * Math.PI);
        shaft.translateZ(0.6);
        scene.add( shaft );




        var light = new THREE.PointLight( 0xffd0d0, 1, 100 );
        light.position.set( 5, 5, 5 );
        scene.add( light );

        var light = new THREE.PointLight( 0xd0d0ff, 1, 100 );
        light.position.set( -5, -5, 5 );
        scene.add( light );

        var light = new THREE.PointLight( 0xffd0d0, 1, 100 );
        light.position.set( -5, 5, -5 );
        scene.add( light );

        var light = new THREE.AmbientLight( 0x606060 ); // soft white light
        scene.add( light );

        camera.position.x = 2;
        camera.position.y = 2;
        camera.position.z = 5;

        var origin = new THREE.Vector3( 0, 0, 0 );
        var xAxis = new THREE.Vector3( 1, 0, 0 );

        controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.maxPolarAngle = 0.9 * Math.PI / 2;
	controls.enableZoom = false;

        function render() {
	    requestAnimationFrame( render );
            //camera.position.x += 0.01;
            //camera.position.y += 0.01;
            //camera.lookAt(origin);
            /*
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            cylinder.rotation.x += 0.01;
            cylinder.rotation.y += 0.01;
            */
            controls.update();
	    renderer.render( scene, camera );
        }
        render();
    }
    var client = new SimpleClient.SimpleClient({questionTemplate: questionTemplate, answerTemplate: answerTemplate});

    client.on("renderQuestionFinished", function() {
        drawFcn();
    });

    return client;
});
