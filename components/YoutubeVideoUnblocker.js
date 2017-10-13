/*global YoutubeInterfaceManager, MirrorFinder */

var YoutubeVideoUnblocker;

(function () {
    "use strict";

    var youtubeVideoUnblocker;

    YoutubeVideoUnblocker = function (document, url) {
        this.url = url;
        this.interfaceManager = null;
        this.observer = null;
        this.isVideoUnavailable = undefined;
        this.mirrorFinder = null;
    };

    YoutubeVideoUnblocker.prototype.execute = function () {
        if (this.isYoutubeVideoLink()) {
            this.interfaceManager = new YoutubeInterfaceManager(document);

            if (this.isNewYouTubeLayout()) {
                console.log('new');
                this.executeForNewYouTubeLayout();
            } else {
                console.log('old');
                this.executeForOldYouTubeLayout();
            }
        }
    };

    YoutubeVideoUnblocker.prototype.executeForOldYouTubeLayout = function () {
        var request, self = this;

        if (this.interfaceManager.isYoutubeVideoUnavailableOldLayout(document)) {

            this.interfaceManager.enableTheaterModeForOldLayout();

            this.interfaceManager.showLoadingFeedback();

            this.mirrorFinder = new MirrorFinder(self.url);
            request = this.mirrorFinder.createRequestToYouPak();

            return;

            // Because we're dealing with an async request, we have to implement the callback below.
            request.onreadystatechange = function () {
                var links,
                    highestQualityVideoLink;

                if (self.mirrorFinder.isXMLHttpRequestDone(request)) {
                    try {
                        links = self.mirrorFinder.findVideoLinksFromYouPak(request.responseText);

                        highestQualityVideoLink = links[links.length - 1];

                        self.interfaceManager.createVideoFrameOldLayout(highestQualityVideoLink);
                    } catch (exception) {
                        self.interfaceManager.showFailureMessageOldLayout();
                    }
                }
            };

            request.send();
        }
    };

    YoutubeVideoUnblocker.prototype.executeForNewYouTubeLayout = function () {
        var request, self = this;

        this.observer = new MutationObserver(function (mutations) {
            if (self.interfaceManager.isYoutubeVideoUnavailable(mutations)) {
                if (self.isVideoUnavailable === undefined) {
                    self.isVideoUnavailable = true;

                    self.interfaceManager.makeNecessaryAdjustmentsToInterface();

                    self.mirrorFinder = new MirrorFinder(self.url);
                    request = self.mirrorFinder.createRequestToYouPak();

                    // Because we're dealing with an async request, we have to implement the callback below.
                    request.onreadystatechange = function () {
                        var links,
                            highestQualityVideoLink;

                        if (self.mirrorFinder.isXMLHttpRequestDone(request)) {
                            try {
                                links = self.mirrorFinder.findVideoLinksFromYouPak(request.responseText);

                                highestQualityVideoLink = links[links.length - 1];

                                self.interfaceManager.createVideoFrame(highestQualityVideoLink);
                            } catch (exception) {
                                self.interfaceManager.showFailureMessage();
                            }
                        }
                    };

                    request.send();
                }
            }
        });

        this.observer.observe(document.body, {
            attributes: true,
            childList: true,
            characterData: false,
            subtree: true,
            attributeOldValue: true
        });
    };

    YoutubeVideoUnblocker.prototype.prepareForUrlChanges = function () {
        var self = this;

        // Set a interval to check for url changes
        setInterval(function () {
            if (self.url !== window.location.href) {
                if (self.interfaceManager) {
                    self.interfaceManager.resetChanges();
                }

                self.url = window.location.href;
                self.isVideoUnavailable = undefined;

                if (self.observer) {
                    self.observer.disconnect();
                }

                self.execute();
            }
        }, 500);
    };

    YoutubeVideoUnblocker.prototype.isYoutubeVideoLink = function () {
        return (/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/watch\?(.*)(v=.+)(.*)$/).test(this.url);
    };

    YoutubeVideoUnblocker.prototype.isNewYouTubeLayout = function () {
        return document.getElementById('watch7-content') === null;
    };

    youtubeVideoUnblocker = new YoutubeVideoUnblocker(document, window.location.toString());
    youtubeVideoUnblocker.prepareForUrlChanges();
    youtubeVideoUnblocker.execute();
}());
