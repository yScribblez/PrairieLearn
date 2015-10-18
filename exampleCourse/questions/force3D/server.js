
define(["PrairieRandom", "PrairieGeom", "QServer"], function(PrairieRandom, PrairieGeom, QServer) {

    var server = new QServer();

    server.getData = function(vid) {
        var rand = new PrairieRandom.RandomGenerator(vid);

        // question parameters
        var params = {};

        // correct answer to the question
        var trueAnswer = {x: 4, y: -4, z: 0};

        // all the question data together
        var questionData = {
            params: params,
            trueAnswer: trueAnswer,
        };
        return questionData;
    };

    return server;
});
