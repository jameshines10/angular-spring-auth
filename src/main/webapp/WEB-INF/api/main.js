/**
 * @fileOverview Entry point for all web calls
 */
var log = require( 'ringo/logging' ).getLogger( module.id );
var {trimpath, trimpathResponse, registerHelper} = require( 'trimpath' );
var {json} = require( 'ringo/jsgi/response' );
var fileUpload = require('ringo/utils/http');
var {ByteArray} = require('binary');
var {Application} = require( 'stick' );

var app = exports.app = Application();
app.configure( 'notfound', 'params', 'mount', 'route' );

var profiles = module.singleton('profiles', function(){
    return {
        "1" : {
            "id"            : 1,
            "firstName"     : "James",
            "lastName"      : "Hines",
            "email"         : "jhines@pykl.com",
            "imageUrl"      : "",
            "bio"           : "This is the bio for James Hines. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Donec id elit non mi porta gravida at eget metus. Nullam id dolor id nibh ultricies vehicula ut id elit.",
            "jobTitle"      : "Web Developer",
            "employer"      : "Pykl Studios",
            "currentCity"   : "Columbus",
            "currentState"  : "OH",
            "homeTown"      : "Dayton",
            "homeState"     : "OH"
        },
        "2" : {
            "id"            : 2,
            "firstName"     : "Kevin",
            "lastName"      : "Sturdevant",
            "email"         : "kevin@pykl.com",
            "imageUrl"      : "",
            "bio"           : "This is the bio for Kevin Sturdevant. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Donec id elit non mi porta gravida at eget metus. Nullam id dolor id nibh ultricies vehicula ut id elit.",
            "jobTitle"      : "UX Specialist/Analyst",
            "employer"      : "Pykl Studios",
            "currentCity"   : "Columbus",
            "currentState"  : "OH",
            "homeTown"      : "Youngstown",
            "homeState"     : "OH"
        },
        "3" : {
            "id"            : 3,
            "firstName"     : "James",
            "lastName"      : "Cook",
            "email"         : "jcook@pykl.com",
            "imageUrl"      : "",
            "bio"           : "This is the bio for James Cook. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Donec id elit non mi porta gravida at eget metus. Nullam id dolor id nibh ultricies vehicula ut id elit.",
            "jobTitle"      : "Founder/CEO",
            "employer"      : "Pykl Studios",
            "currentCity"   : "Columbus",
            "currentState"  : "OH",
            "homeTown"      : "New York",
            "homeState"     : "NY"
        }
    }
});

registerHelper( {
    include: function ( path, context ) {
        return trimpath( path );
    },
    ctx: function ( url ) {
        return ctx( url );
    }
} );

function ctx( url ) {
    // Only prepend the context path if the URL is a relative
    if ( /^\//.test( url ) ) {
        var req = getRequest();
        if ( !req ) {
            throw 'Function ctx requires a request object to be known to the application.';
        }

        // Get the servlet's context path
        var contextPath = req.env.servletRequest.contextPath;
        url = contextPath + url;
    }
    return url;
}

function getRequest() {
    var app = require( module.resolve( 'main' ) ).app;
    if ( app ) return app.request;
    return null;
}

/************************
 *
 * Website Get/Post functions
 *
 ************************/

app.get( '/', function ( req ) {
    return homepage( req );
} );

app.get( '/profile.html', function ( req ) {
    return homepage( req );
} );

app.get( '/ping', function ( req ) {
    var servletRequest = req.env.servletRequest;

    return json( {
        url: '/ping',
        user: servletRequest.isUserInRole( 'ROLE_USER' ),
        admin: servletRequest.isUserInRole( 'ROLE_ADMIN' ),
        anonymous: servletRequest.isUserInRole( 'ROLE_ANONYMOUS' )
    } );
} );


/**
 * Returns the authentication credentials for the current user using the Spring Security
 * classes.
 */
app.get( '/auth', function ( req ) {
    var SecurityContextHolder = Packages.org.springframework.security.core.context.SecurityContextHolder;
    var auth = SecurityContextHolder.context.authentication;

    var result = {
        principal: String( auth.principal ),
//		isAuthenticated: auth.isAuthenticated(),
        roles: []
    };

    var authorities = auth.authorities.iterator();
    while ( authorities.hasNext() ) {
        var authority = authorities.next();
        result.roles.push( authority.authority );
    }

    return json( result );
} );

app.post('/profiles/', function(req){
    var id = Math.floor(new Date().getTime()/1000).toString();

    var newProfile = req.params;
    newProfile.id = id;

    profiles[id] = req.params;

    return json(newProfile);
});

app.get('/profiles/:id', function(req, id){
    return json( profiles[id] );
});

app.get('/profiles', function(req){
    return json( profiles );
});

app.put('/profiles/:id', function(req, id){
    var member = req.params;

    profiles[id] = member;

    return json(member);
});

app.get('/profiles/delete/:id', function(req, id){
    delete profiles[id];

    return json('success');
});

app.get('/profiles/asyncEmail/:email', function(req, email){
    java.lang.Thread.sleep(5000);
    var valid = true;

    for(var key in profiles){
        if(email === profiles[key].email){
            valid = false;
            break;
        }
    }

    return json(valid);
});

/**
 * @function
 * @name POST /images/upload
 * @description Uploads images to S3 via RoundTable
 * @param {JsgiRequest} request
 * @returns {JsgiResponse} An HTML <div> containing a JSON string with upload results
 */
app.post('/profiles/pics/:id', function (req, id) {

    var profile = profiles[id];

    if (!profile) return {
        status:404,
        headers:{"Content-Type":'application/json'},
        body:[]
    };

    var contentType = req.env.servletRequest.getContentType();
    if ((req.method === "POST" || req.method === "PUT") && fileUpload.isFileUpload(contentType)) {
        log.info('File pre-upload: ' + JSON.stringify(req.params, null, 4));

        var encoding = req.env.servletRequest.getCharacterEncoding();

        var params = {};

        fileUpload.parseFileUpload(req, params, encoding, fileUpload.TempFileFactory);
        log.info('File uploaded: ' + JSON.stringify(params, null, 4));
        profile.imageUrl = params.file.tempfile;

        return {
            status: 201,
            headers: {
                "Content-Type": "text/plain"
            },
            body: [req.env.servletRequest.getRequestURL().toString()]
        };

    }
    return {
        status:400,
        headers:{"Content-Type":'text/html'},
        body:[]
    };
});


app.get('/profiles/pics/:id', function(req, id){
    var profile = profiles[id];

    if (!profile) return {
        status:404,
        headers:{"Content-Type":'application/json'},
        body:[]
    };

    if (profile.imageUrl) {


        var input = new java.io.FileInputStream(new java.io.File(profile.imageUrl));
        var out = req.env.servletResponse.outputStream;

        var buffer = new ByteArray(1024);
        var len = input.read(buffer);
        while (len != -1) {
            out.write(buffer, 0, len);
            len = input.read(buffer);
        }
        out.close();
        input.close();

        return {
            status: 200,
            headers: {
                'Content-Type': 'image/jpeg',
                'X-JSGI-Skip-Response': 'true'
            },
            body: []
        };
    }

    return {
        status:404,
        headers:{"Content-Type":'application/json'},
        body:[]
    }
});


/************************
 *
 * Page functions
 *
 ************************/

function homepage( req ) {
    return json( {homepage: true} );
}



