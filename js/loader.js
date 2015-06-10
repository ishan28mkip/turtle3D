requirejs.config({
    baseUrl: "lib",

    paths: {
        activity: "../js",
        twewn: "../lib/tweenjs",
    }
});

requirejs(["activity/activity"]);
