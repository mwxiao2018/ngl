/**
 * @file GUI
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */



NGL.download = function( dataUrl, downloadName ){

    if( !dataUrl ){
        console.warn( "NGL.download: no dataUrl given" );
        return;
    }

    downloadName = downloadName || "download";

    var a = document.createElement( 'a' );
    document.body.appendChild( a );
    a.href = dataUrl;
    a.download = downloadName;
    a.target = "_blank";
    a.click();

    document.body.removeChild( a );

};


NGL.Widget = function(){

};

NGL.Widget.prototype = {

};


NGL.ViewportWidget = function( stage ){

    var viewer = stage.viewer;
    var renderer = viewer.renderer;

    var container = new UI.Panel();
    container.setPosition( 'absolute' );

    viewer.container = container.dom;
    container.dom.appendChild( renderer.domElement );

    // event handlers

    container.dom.addEventListener( 'dragover', function( e ){

        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';

    }, false );

    container.dom.addEventListener( 'drop', function( e ){

        e.stopPropagation();
        e.preventDefault();

        var fileList = e.dataTransfer.files;
        var n = fileList.length;

        for( var i=0; i<n; ++i ){

            stage.loadFile( fileList[ i ] );

        }

    }, false );


    return container;

};


NGL.ToolbarWidget = function( stage ){

    var signals = stage.signals;
    var container = new UI.Panel();

    var messagePanel = new UI.Panel();

    signals.atomPicked.add( function( atom ){

        var name = "none";

        if( atom ){
            name = atom.qualifiedName() + 
                " (" + atom.residue.chain.model.structure.name + ")";
        }

        messagePanel
            .clear()
            .add( new UI.Text( "Picked: " + name ) );
        
    } );

    container.add( messagePanel );

    return container;

};


NGL.MenubarWidget = function( stage ){

    var container = new UI.Panel();

    container.add( new NGL.MenubarFileWidget( stage ) );
    container.add( new NGL.MenubarViewWidget( stage ) );
    container.add( new NGL.MenubarExampleWidget( stage ) );
    container.add( new NGL.MenubarHelpWidget( stage ) );

    return container;

};


NGL.MenubarFileWidget = function( stage ){

    var fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.multiple = true;
    fileInput.style = "visibility:hidden";
    fileInput.addEventListener( 'change', function( e ){

        var fileList = e.target.files;
        var n = fileList.length;

        for( var i=0; i<n; ++i ){

            addFile( fileList[ i ] );

        }

    }, false );

    function addFile( path ){

        stage.loadFile( path );

    }

    // event handlers

    function onOpenOptionClick () {

        fileInput.dispatchEvent( new MouseEvent('click', {
            'view': window,
            'bubbles': true,
            'cancelable': true
        }));

    }

    function onImportOptionClick(){

        var dirWidget = new NGL.DirectoryListingWidget(

            stage, "Import file", [ "pdb", "gro", "obj", "ply" ],

            function( path ){

                var ext = path.path.split('.').pop().toLowerCase();

                if( ext == "pdb" || ext == "gro" || 
                    ext == "obj" || ext == "ply" ){

                    stage.loadFile( "../data/" + path.path );
                    
                }else{

                    console.log( "unknown filetype: " + ext );

                }

                dirWidget.dispose();

            }

        );

        dirWidget
            .setOpacity( "0.8" )
            .setLeft( "50px" )
            .setTop( "80px" )
            .attach();

    }

    function onExportImageOptionClick () {

        NGL.download( stage.viewer.getImage(), "screenshot.png" );

    }

    function onPdbInputKeyDown ( e ) {

        if( e.keyCode === 13 ){

            addFile( e.target.value );
            e.target.value = "";

        }

    }

    // configure menu contents

    var createOption = UI.MenubarHelper.createOption;
    var createInput = UI.MenubarHelper.createInput;
    var createDivider = UI.MenubarHelper.createDivider;

    var menuConfig = [
        createOption( 'Open...', onOpenOptionClick ),
        createOption( 'Import...', onImportOptionClick ),
        createInput( 'PDB', onPdbInputKeyDown ),
        createDivider(),
        createOption( 'Export image', onExportImageOptionClick, 'camera' ),
    ];

    var optionsPanel = UI.MenubarHelper.createOptionsPanel( menuConfig );

    return UI.MenubarHelper.createMenuContainer( 'File', optionsPanel );

};


NGL.MenubarViewWidget = function( stage ){

    function setTheme( value ) {

        document.getElementById( 'theme' ).href = value;

    }

    // event handlers

    function onLightThemeOptionClick () {

        setTheme( '../css/light.css' );
        stage.viewer.setBackground( "white" );
        // editor.config.setKey( 'theme', 'css/light.css' );

    }

    function onDarkThemeOptionClick () {

        setTheme( '../css/dark.css' );
        stage.viewer.setBackground( "black" );
        // editor.config.setKey( 'theme', 'css/dark.css' );

    }

    function onFullScreenOptionClick () {

        stage.viewer.fullscreen();

    }

    function onCenterOptionClick () {

        stage.centerView();

    }

    // configure menu contents

    var createOption = UI.MenubarHelper.createOption;
    var createDivider = UI.MenubarHelper.createDivider;

    var menuConfig = [
        createOption( 'Light theme', onLightThemeOptionClick ),
        createOption( 'Dark theme', onDarkThemeOptionClick ),
        createDivider(),
        createOption( 'Full screen', onFullScreenOptionClick, 'expand' ),
        createOption( 'Center', onCenterOptionClick, 'bullseye' )
    ];

    var optionsPanel = UI.MenubarHelper.createOptionsPanel( menuConfig );

    return UI.MenubarHelper.createMenuContainer( 'View', optionsPanel );

};


NGL.MenubarExampleWidget = function( stage ){

    // configure menu contents

    var createOption = UI.MenubarHelper.createOption;
    var createDivider = UI.MenubarHelper.createDivider;

    var menuConfig = [];

    Object.keys( NGL.Examples.data ).forEach( function( name ){

        if( name.charAt( 0 ) === "_" ) return;

        menuConfig.push(

            createOption( name, function(){

                NGL.Examples.load( name, stage );

            } )

        );

    } );

    var optionsPanel = UI.MenubarHelper.createOptionsPanel( menuConfig );

    return UI.MenubarHelper.createMenuContainer( 'Example', optionsPanel );

};


NGL.MenubarHelpWidget = function( stage ){

    // event handlers

    function onDocOptionClick () {
        window.open( '../doc/index.html', '_blank' );
    }

    function onUnittestsOptionClick () {
        window.open( '../test/unit/unittests.html', '_blank' );
    }

    function onBenchmarksOptionClick () {
        window.open( '../test/bench/benchmarks.html', '_blank' );
    }

    // configure menu contents

    var createOption = UI.MenubarHelper.createOption;
    var createDivider = UI.MenubarHelper.createDivider;

    var menuConfig = [
        createOption( 'Documentation', onDocOptionClick ),
        createDivider(),
        createOption( 'Unittests', onUnittestsOptionClick ),
        createOption( 'Benchmarks', onBenchmarksOptionClick )
    ];

    var optionsPanel = UI.MenubarHelper.createOptionsPanel( menuConfig );

    return UI.MenubarHelper.createMenuContainer( 'Help', optionsPanel );

};


NGL.SidebarWidget = function( stage ){

    var signals = stage.signals;
    var container = new UI.Panel();

    signals.componentAdded.add( function( component ){

        console.log( component );

        if( component instanceof NGL.StructureComponent ){

            container.add( new NGL.StructureComponentWidget( component, stage ) );

        }else if( component instanceof NGL.SurfaceComponent ){

            container.add( new NGL.SurfaceComponentWidget( component, stage ) );

        }else{

            console.warn( "NGL.SidebarWidget: component type unknown", component );

        }

    } );

    return container;

};


NGL.ComponentWidget = function( component, stage ){

    var container = new UI.Panel();

    

    return container;

};


NGL.StructureComponentWidget = function( component, stage ){

    var signals = component.signals;
    var container = new UI.CollapsiblePanel();

    var reprContainer = new UI.Panel();
    var trajContainer = new UI.Panel();

    signals.representationAdded.add( function( repr ){

        reprContainer.add( new NGL.RepresentationWidget( repr, component ) );
        
    } );

    signals.trajectoryAdded.add( function( traj ){

        trajContainer.add( new NGL.TrajectoryWidget( traj, component ) );
        
    } );

    signals.visibilityChanged.add( function( value ){

        if( value ){
            toggle.removeClass( "eye-slash", "eye" ).addClass( "eye" );
        }else{
            toggle.removeClass( "eye", "eye-slash" ).addClass( "eye-slash" );
        }
        
    } );

    // Actions

    var toggle = new UI.Icon( "eye" )
        .setTitle( "hide/show" )
        .setMarginLeft( "25px" )
        .onClick( function(){

            if( toggle.hasClass( "eye" ) ){
                component.setVisibility( false );
            }else{
                component.setVisibility( true );
            }

        } );

    var center = new UI.Icon( "bullseye" )
        .setTitle( "center" )
        .setMarginLeft( "10px" )
        .onClick( function(){

            // component.centerView( "backbone" );
            component.centerView();

        } );

    var dispose = new UI.Icon( "trash-o" )
        .setTitle( "delete" )
        .setMarginLeft( "10px" )
        .onClick( function(){

            if( dispose.getColor() === "rgb(178, 34, 34)" ){

                stage.removeComponent( component );
                container.dispose();

            }else{

                dispose.setColor( "rgb(178, 34, 34)" );

                setTimeout( function(){ 
                    dispose.setColor( "#888" );
                }, 1000);

            }

        } );

    // Selection for subset

    var seleRow = new UI.Panel();
    var sele = new NGL.SelectionWidget()
        .setWidth( '195px' )
        .setValue( component.sele )
        .onEnter( function( value ){
            repr.changeSelection( value );
        } );

    seleRow.add( new UI.Text( 'Sele' ).setWidth( '45px' ).setMarginLeft( "20px" ) );
    seleRow.add( sele );

    container.add( seleRow );

    // Export PDB
    
    var pdb = new UI.Button( "export" ).onClick( function(){

        // https://github.com/eligrey/FileSaver.js/blob/master/FileSaver.js

        var blob = new Blob(
            [ component.structure.toPdb() ],
            { type: 'text/plain' }
        );

        NGL.download( URL.createObjectURL( blob ), "structure.pdb" );

        menuPanel.setDisplay( "none" );

    } );

    // Add representation

    var reprOptions = { "": "[ add ]" };
    for( var key in NGL.representationTypes ){
        reprOptions[ key ] = key;
    }

    var repr = new UI.Select()
        .setColor( '#444' )
        .setOptions( reprOptions )
        .onChange( function(){

            component.addRepresentation( repr.getValue() );
            repr.setValue( "" );
            menuPanel.setDisplay( "none" );

        } );

    // Import trajectory

    var traj = new UI.Button( "import" ).onClick( function(){

        menuPanel.setDisplay( "none" );

        var dirWidget = new NGL.DirectoryListingWidget(

            stage, "Import trajectory", [ "xtc" ],

            function( path ){

                var ext = path.path.split('.').pop().toLowerCase();

                if( ext == "xtc" ){

                    console.log( path );

                    component.addTrajectory( path.path );

                    dirWidget.dispose();
                    
                }else{

                    console.log( "unknown trajectory type: " + ext );

                }

            }

        );

        dirWidget
            .setOpacity( "0.8" )
            .setLeft( "50px" )
            .setTop( "80px" )
            .attach();

    });

    // Superpose

    function setSuperposeOptions(){

        var superposeOptions = { "": "[ structure ]" };
        stage.compList.forEach( function( o, i ){
            if( o instanceof NGL.StructureComponent && o !== component ){
                superposeOptions[ i ] = o.name;
            }
        } );
        superpose.setOptions( superposeOptions );

    }

    stage.signals.componentAdded.add( setSuperposeOptions );
    stage.signals.componentRemoved.add( setSuperposeOptions );

    var superpose = new UI.Select()
        .setColor( '#444' )
        .onChange( function(){

            var s1 = component.structure;
            var s2 = stage.compList[ superpose.getValue() ].structure;

            NGL.superpose( s1, s2, true );

            component.updateRepresentations();
            component.centerView();

            superpose.setValue( "" );
            menuPanel.setDisplay( "none" );

        } );

    setSuperposeOptions();

    // SS calculate
    
    var ss = new UI.Button( "calculate" ).onClick( function(){

        component.structure.autoSS();
        component.rebuildRepresentations();

        menuPanel.setDisplay( "none" );

    } );

    // Menu

    var menuPanel = new UI.OverlayPanel()
        .add( new UI.Text( "PDB file" ).setWidth( "110px" ) )
        .add( pdb )
        .add( new UI.Break() )
        .add( new UI.Text( "Representation" ).setWidth( "110px" ) )
        .add( repr )
        .add( new UI.Break() )
        .add( new UI.Text( "Trajectory" ).setWidth( "110px" ) )
        .add( traj )
        .add( new UI.Break() )
        .add( new UI.Text( "Superpose" ).setWidth( "110px" ) )
        .add( superpose )
        .add( new UI.Break() )
        .add( new UI.Text( "SS" ).setWidth( "110px" ) )
        .add( ss );

    var menu = new UI.Icon( "bars" )
        .setTitle( "menu" )
        .setMarginLeft( "47px" )
        .onClick( function(){

            if( menuPanel.getDisplay() === "block" ){

                menuPanel.setDisplay( "none" );
                return;

            }

            var box = menu.getBox();

            menuPanel
                .setRight( ( window.innerWidth - box.left + 10 ) + "px" )
                .setTop( box.top + "px" )
                .setDisplay( "block" )
                .attach();

        } );

    

    container.addStatic( new UI.Text( component.name ).setWidth( "100px" ) );
    container.addStatic( toggle );
    container.addStatic( center );
    container.addStatic( dispose );
    container.addStatic( menu );
    // container.addStatic( repr );

    // Fill container

    container.add( trajContainer );
    container.add( reprContainer );

    return container;

};


NGL.SurfaceComponentWidget = function( component, stage ){

    var signals = component.signals;
    var container = new UI.CollapsiblePanel();

    signals.visibilityChanged.add( function( value ){

        if( value ){
            toggle.removeClass( "eye-slash", "eye" ).addClass( "eye" );
        }else{
            toggle.removeClass( "eye", "eye-slash" ).addClass( "eye-slash" );
        }
        
    } );

    // Actions

    var toggle = new UI.Icon( "eye" )
        .setTitle( "hide/show" )
        .setMarginLeft( "25px" )
        .onClick( function(){

            if( toggle.hasClass( "eye" ) ){
                component.setVisibility( false );
            }else{
                component.setVisibility( true );
            }

        } );

    var center = new UI.Icon( "bullseye" )
        .setTitle( "center" )
        .setMarginLeft( "10px" )
        .onClick( function(){

            component.centerView( "backbone" );

        } );

    var dispose = new UI.Icon( "trash-o" )
        .setTitle( "delete" )
        .setMarginLeft( "10px" )
        .onClick( function(){

            if( dispose.getColor() === "rgb(178, 34, 34)" ){

                stage.removeComponent( component );
                container.dispose();

            }else{

                dispose.setColor( "rgb(178, 34, 34)" );

                setTimeout( function(){ 
                    dispose.setColor( "#888" );
                }, 1000);

            }

        } );
    
    container.addStatic( new UI.Text( component.name ).setWidth( "100px" ) );
    container.addStatic( toggle );
    container.addStatic( center );
    container.addStatic( dispose );

    return container;

};


NGL.RepresentationWidget = function( repr, component ){

    var signals = repr.signals;

    var container = new UI.CollapsiblePanel()
        .setMarginLeft( "20px" );

    signals.visibilityChanged.add( function( value ){

        if( value ){
            toggle.removeClass( "eye-slash", "eye" ).addClass( "eye" );
        }else{
            toggle.removeClass( "eye", "eye-slash" ).addClass( "eye-slash" );
        }
        
    } );

    component.signals.representationRemoved.add( function( _repr ){

        if( repr === _repr ) container.dispose();
        
    } );

    // Actions

    var toggle = new UI.Icon( "eye" )
        .setTitle( "hide/show" )
        .setMarginLeft( "25px" )
        .onClick( function(){

            if( toggle.hasClass( "eye" ) ){
                repr.setVisibility( false );
            }else{
                repr.setVisibility( true );
            }

        } );

    var dispose = new UI.Icon( "trash-o" )
        .setTitle( "delete" )
        .setMarginLeft( "10px" )
        .onClick( function(){

            if( dispose.getColor() === "rgb(178, 34, 34)" ){

                component.removeRepresentation( repr );

            }else{

                dispose.setColor( "rgb(178, 34, 34)" );

                setTimeout( function(){ 
                    dispose.setColor( "#888" );
                }, 1000);
                
            }

        } );

    container.addStatic( new UI.Text( repr.name ).setWidth( "80px" ) );
    container.addStatic( toggle );
    container.addStatic( dispose );

    // Add sele

    var seleRow = new UI.Panel();
    var sele = new NGL.SelectionWidget()
        .setWidth( '175px' )
        .setValue( repr.selection.selectionStr )
        .onEnter( function( value ){
            repr.changeSelection( value );
        } );
 
    seleRow.add( new UI.Text( 'Sele' ).setWidth( '45px' ).setMarginLeft( "20px" ) );
    seleRow.add( sele );

    container.add( seleRow );

    return container;

};


NGL.SelectionWidget = function(){

    var textarea = new UI.AdaptiveTextArea();
    var container = textarea;

    var check = function( sele ){

        var selection = new NGL.Selection( sele );
        
        return !selection.selection[ "error" ];

    }

    container.setValue = function( value ){

        UI.AdaptiveTextArea.prototype.setValue.call(
            textarea, value || ""
        );

        return container;

    }

    container.onEnter = function( callback ){

        textarea.onKeyDown( function( e ){
            
            var value = textarea.getValue();

            if( e.keyCode === 13 ){

                callback( value );
                e.preventDefault();

                if( check( value ) ){
                    textarea.setBackgroundColor( "#ccc" );
                }else{
                    textarea.setBackgroundColor( "tomato" );
                }

            }else{

                textarea.setBackgroundColor( "skyblue" );

            }

        } );

        return container;

    }

    return container;

}


NGL.TrajectoryWidget = function( traj, component ){

    var signals = traj.signals;

    var container = new UI.CollapsiblePanel()
        .setMarginLeft( "20px" );

    component.signals.trajectoryRemoved.add( function( _traj ){

        if( traj === _traj ) container.dispose();
        
    } );

    var numframes = new UI.Panel()
        .setMarginLeft( "10px" )
        .setDisplay( "inline" )
        .add( new UI.Icon( "spinner" ).addClass( "spin" ) );

    signals.gotNumframes.add( function( value ){

        numframes.clear().add( new UI.Text( "#" + value ) );
        frame.setRange( -1, value - 1 );
        frame2.setRange( -1, value - 1 );

        step.setValue( Math.ceil( ( value + 1 ) / 100 ) );
        
    } );

    //1000 = n / step 

    signals.frameChanged.add( function( value ){

        frame.setValue( value );
        frame2.setValue( value );

        numframes.clear().add( new UI.Text(
            "#" + traj.numframes + " (" + traj.frameCacheSize + ")"
        ) );

        inProgress = false;
        
    } );

    container.addStatic( new UI.Text( "Trajectory" ) );
    container.addStatic( numframes );

    // frames

    var frameRow = new UI.Panel();

    var frame = new UI.Integer( -1 )
        .setMarginLeft( "5px" )
        .setWidth( "70px" )
        .setRange( -1, -1 )
        .onChange( function( e ){

            traj.setFrame( frame.getValue() );

        } );

    var step = new UI.Integer( 1 )
        .setMarginLeft( "5px" )
        .setWidth( "40px" )
        .setRange( 1, 10000 );

    var frameRow2 = new UI.Panel();

    var inProgress = false;

    var frame2 = new UI.Range( -1, -1, -1, 1 )
        .setWidth( "195px" )
        .onInput( function( e ){

            if( !inProgress && frame2.getValue() !== traj.currentFrame ){
                inProgress = true;
                // console.log( "input", e );
                traj.setFrame( frame2.getValue() );
            }

        } )
        .onChange( function( e ){

            // ensure the last requested frame gets displayed eventually

            if( frame2.getValue() !== traj.currentFrame ){
                inProgress = true;
                // console.log( "change", e );
                traj.setFrame( frame2.getValue() );
            }

        } );

    // animation

    var i = 0;
    var animSpeed = 50;
    var animStopFlag = true;
    var animFunc = function(){
        
        if( !inProgress ){
            inProgress = true;
            traj.setFrame( i );
            i += step.getValue();
            if( i >= traj.numframes ) i = 0;
        }

        if( !animStopFlag ){
            setTimeout( animFunc, animSpeed );
        }

    }

    var animButton = new UI.Icon( "play" )
        .setMarginRight( "10px" )
        .setMarginLeft( "20px" )
        .onClick( function(){

            if( animButton.hasClass( "play" ) ){

                animButton.switchClass( "play", "pause" );
                animStopFlag = false;
                i = Math.max( 0, traj.currentFrame );
                animFunc();

            }else{

                animButton.switchClass( "pause", "play" );
                animStopFlag = true;

            }

        } );

    frameRow.add( new UI.Text( 'Frame' ).setMarginLeft( "20px" ) );
    frameRow.add( frame );
    frameRow.add( new UI.Text( 'Step' ).setMarginLeft( "10px" ) );
    frameRow.add( step );
    frameRow2.add( animButton );
    frameRow2.add( frame2 );

    var setSuperpose = new UI.Checkbox( traj.params.superpose )
        .setMarginLeft( "10px" )
        .onChange( function(){
            traj.setSuperpose( setSuperpose.getValue() );
        } );
    var frameRow3 = new UI.Panel()
        .add( new UI.Text( 'Superpose' ).setMarginLeft( "20px" ) )
        .add( setSuperpose );

    container.add( frameRow );
    container.add( frameRow2 );
    container.add( frameRow3 );

    return container;

};


NGL.DirectoryListing = function(){

    var SIGNALS = signals;

    this.signals = {

        listingLoaded: new SIGNALS.Signal(),
        
    };

};

NGL.DirectoryListing.prototype = {

    getListing: function( path ){

        var scope = this;

        path = path || "";

        var loader = new THREE.XHRLoader();
        var url = "../dir/" + path;

        loader.load( url, function( responseText ){

            var json = JSON.parse( responseText );

            // console.log( json );

            scope.signals.listingLoaded.dispatch( path, json );

        });

    },

    getFolderDict: function( path ){

        path = path || "";
        var options = { "": "" };
        var full = [];

        path.split( "/" ).forEach( function( chunk ){

            full.push( chunk );
            options[ full.join( "/" ) ] = chunk;

        } );

        return options;

    }

};


NGL.lastUsedDirectory = "";


NGL.DirectoryListingWidget = function( stage, heading, filter, callback ){

    // from http://stackoverflow.com/a/20463021/1435042
    function fileSizeSI(a,b,c,d,e){
        return (b=Math,c=b.log,d=1e3,e=c(a)/c(d)|0,a/b.pow(d,e)).toFixed(2)
            +String.fromCharCode(160)+(e?'kMGTPEZY'[--e]+'B':'Bytes')
    }

    var dirListing = new NGL.DirectoryListing();
    dirListing.getListing( NGL.lastUsedDirectory );

    var signals = dirListing.signals;
    var container = new UI.OverlayPanel();

    var headingPanel = new UI.Panel()
        .setBorderBottom( "1px solid #555" )
        .setHeight( "30px" );

    var listingPanel = new UI.Panel()
        .setMarginTop( "10px" )
        .setMinHeight( "100px" )
        .setMaxHeight( "500px" )
        .setOverflow( "auto" );

    var folderSelect = new UI.Select()
        .setColor( '#444' )
        .setMarginLeft( "20px" )
        .setWidth( "" )
        .setMaxWidth( "200px" )
        .setOptions( dirListing.getFolderDict() )
        .onChange( function(){

            dirListing.getListing( folderSelect.getValue() );

        } );

    heading = heading || "Directoy listing"

    headingPanel.add( new UI.Text( heading ) );
    headingPanel.add( folderSelect );
    headingPanel.add( 
        new UI.Icon( "times" )
            .setMarginLeft( "20px" )
            .setFloat( "right" )
            .onClick( function(){

                container.dispose();

            } )
    );
    
    container.add( headingPanel );
    container.add( listingPanel );

    signals.listingLoaded.add( function( folder, listing ){

        NGL.lastUsedDirectory = folder;

        listingPanel.clear();

        folderSelect
            .setOptions( dirListing.getFolderDict( folder ) )
            .setValue( folder );

        listing.forEach( function( path ){

            var ext = path.path.split('.').pop().toLowerCase();

            if( filter && !path.dir && filter.indexOf( ext ) === -1 ){

                return;

            }

            var icon, name;
            if( path.dir ){
                icon = "folder-o";
                name = path.name;
            }else{
                icon = "file-o";
                name = path.name + String.fromCharCode(160) +
                    "(" + fileSizeSI( path.size ) + ")";
            }

            var pathRow = new UI.Panel()
                .setDisplay( "block" )
                .add( new UI.Icon( icon ).setWidth( "20px" ) )
                .add( new UI.Text( name ) )
                .onClick( function(){

                    if( path.dir ){

                        dirListing.getListing( path.path );

                    }else{

                        callback( path );

                    }

                } );

            listingPanel.add( pathRow );

        } )

    } );

    return container;

};


NGL.VirtualListWidget = function( items ){

    UI.Element.call( this );

    var dom = document.createElement( 'div' );
    dom.className = 'VirtualList';
    // dom.style.cursor = 'default';
    // dom.style.display = 'inline-block';
    // dom.style.verticalAlign = 'middle';

    this.dom = dom;

    this._items = items;

    this.list = new VirtualList({
        w: 280,
        h: 300,
        itemHeight: 31,
        totalRows: items.length,
        generatorFn: function( index ) {

            var panel = new UI.Panel();
            var text = new UI.Text()
                .setColor( "orange" )
                .setMarginLeft( "10px" )
                .setValue( "ITEM " + items[ index ] );

            panel.add( text );

            return panel.dom;

        }
    });

    console.log( this.dom );
    console.log( this.list );

    this.dom.appendChild( this.list.container );

    return this;

};

