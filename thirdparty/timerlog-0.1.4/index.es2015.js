module.exports = timerlog;


const options_storage = {}

const PROJECT_NAME = 'timerlog';

const ERROR_PREFIX = PROJECT_NAME+': ';
const WRONG_USAGE = ERROR_PREFIX+'wrong usage: ';

function timerlog() {
    const options = process_arguments.apply(null, arguments);

    Object.keys(options).forEach(k => {
        if( ! ['message', 'id', 'start_timer', 'end_timer', 'start_timestamp', 'measured_time', 'tag', 'disabled', 'measured_time_threshold', 'lap_time', 'nth_lap_time', ].includes(k) ) {
            throw new Error(WRONG_USAGE+'unknown argument `'+k+'`');
        }
    });

    if( options.start_timer && !options.end_timer && !options.lap_time ) {
        return options.id;
    }
    if( options.measured_time !== undefined && options.measured_time < options.measured_time_threshold ) {
        return;
    }
    if( options.disabled ) {
        return;
    }
    print(options);
}

function process_arguments() {
    if( arguments.length !== 1 || !arguments[0] || arguments[0].constructor !== Object ) {
        throw new Error(WRONG_USAGE+PROJECT_NAME+' should be called with exactly one argument and this argument should be an object');
    }

    let opts = arguments[0];

    if( [opts.lap_time, opts.start_timer, opts.end_timer].filter(v=>!!v).length > 1 ) {
        throw new Error(WRONG_USAGE+"only exactly one of `start_timer`, `end_timer`, or `lap_time` should be truthy");
    }

    if( opts.lap_time || opts.start_timer || opts.end_timer ) {
        opts = handle_timer_logic(opts);
    }

    return opts;

    function handle_timer_logic(opts) {
        if( opts.start_timer ) {
            opts.start_timestamp = opts.start_timestamp || get_timestamp();
            opts.id = opts.id || Math.random();
            if( options_storage[opts.id] ) {
                throw new Error(WRONG_USAGE+"trying to start a new timer while a timer is already running for `"+opts.id+"`");
            }
        }

        if( opts.end_timer || opts.lap_time ) {
            const timestamp = get_timestamp();
            if( ! opts.id ) throw new Error(WRONG_USAGE+"`id` required when `opts.end_timer==true`");
            const options_stored = options_storage[opts.id];
            if( ! options_stored ) throw new Error(ERROR_PREFIX+"couldn't find options storage for `"+opts.id+"`");
            opts = Object.assign({}, options_stored, opts);
            opts.measured_time = timestamp - opts.start_timestamp;
        }

        if( opts.end_timer ) {
            delete options_storage[opts.id];
        } else {
            options_storage[opts.id] = opts;
        }

        if( opts.lap_time ) {
            opts.nth_lap_time = (opts.nth_lap_time||0) + 1;
        }

        return opts;

        function get_timestamp() {
            if(typeof performance === "object") {
                return performance.now()|0;
            }
            return new Date();
        }
    }
}

function print(options) {

    if( is_disabled(options) ) {
        return;
    }

    const prefix =
        [PROJECT_NAME]
        .concat( options.tag ? [options.tag] : [] )
        .concat( options.lap_time && !options.end_timer ? ['lap-'+options.nth_lap_time] : [] )
        .concat( options.measured_time !== undefined ? [options.measured_time+'ms'] : [] )
        .map(s => '['+s+']')
        .join('');

    console.info(
        [
            prefix,
            options.message||options.id,
        ]
        .filter(v=>!!v).join(' ')
    );
}

function is_disabled(options) {
    const locally_enabled = !options.tag ? null : get_setting(PROJECT_NAME+'_'+options.tag);
    const globally_enabled = get_setting(PROJECT_NAME);
    if( locally_enabled || globally_enabled ) {
        return false;
    }
    return true;
}

function get_setting(key) {
    if( typeof window === 'undefined' ) {
        return true;
    }
    const localStorageValue = window.localStorage[key]
    if( ! localStorageValue ) {
        return false;
    }
    try{
        if( ! JSON.parse(localStorageValue) ) {
            return false;
        }
    }catch(e){};
    return true;
}

