window.jQuery = window.$ = jQuery;

function isMobileBrowser() {
    return jQuery.browser.mobile === true;
}

(function($) {
    "use strict";

    // Navigation Menu
    new gnMenu(document.getElementById('gn-menu'));

    // Scrolling
    $(".scroll").click(function(event) {
        event.preventDefault();
        //calculate destination place
        var dest = 0;
        if ($(this.hash).offset().top > $(document).height() - $(window).height()) {
            dest = $(document).height() - $(window).height();
        } else {
            dest = $(this.hash).offset().top;
        }
        //go to destination
        $('html,body').animate({
            scrollTop: dest
        }, 1000, 'swing');
    });

    // Initialize Fancybox
    $(".fancybox").fancybox({
        padding: 0,
        helpers: {
            overlay: {
                css: {
                    'background': 'rgba(255, 255, 255, 0.9)'
                }
            }
        }
    });

    $('.fancybox-media').fancybox({
        openEffect: 'none',
        closeEffect: 'none',
        helpers: {
            media: {}
        }
    });

    jQuery(document).ready(function($) {
        jQuery('.comment_form').removeAttr('class').attr('class', 'form-theme-style');
        jQuery('.form-submit #submit').removeAttr('class').attr('class', 'btn btn-primary btn-lg');
        jQuery('.comment-respond').removeAttr('class').attr('class', 'add-comment');
        jQuery('#respond').removeAttr('id').attr('id', 'add-comment');
    });
    jQuery(window).load(function() {
        jQuery(".widget_search form").attr('class', 'searchForm');
        jQuery(".widget_search .search .form-control").attr('placeholder', 'Type here...');
        jQuery(".widget_categories ul").attr('class', 'list-categories');
        jQuery(".widget_archive ul").attr('class', 'catArchives');
        jQuery(".widget_meta ul").attr('class', 'catArchives');
        jQuery(".widget_tag_cloud ul").attr('class', 'tagList');
    });
    jQuery(document).ready(function($) {
        var $hideMe, $showMe, $containerHideShow;

        $hideMe = $('#hide-add-comment');
        $showMe = $('#show-add-comment');
        $containerHideShow = $('#add-comment');

        $hideMe.click(function() {
            $showMe.css("display", "block");
            $hideMe.css("display", "none");
            $containerHideShow.css("height", "0");
            return false;
        });

        $showMe.click(function() {
            $showMe.css("display", "none");
            $hideMe.css("display", "block");
            $containerHideShow.css("height", "400px");
            return false;
        });
    });
    $(function() {
        $("[rel='tooltip']").tooltip();
    });


    /* hover effects */
    var touchHovers = (function() {
        var speed = 300,
            easing = mina.backout,
            $elements = null,
            $originals = null,
            originals = {};

        function init() {
            updateVars();
            bindEvents();
        }

        function updateVars() {
            $elements = $('body').find('.svg-hover');
            $originals = $elements.clone();
        }

        function bindEvents() {
            originals = {};
            $elements.each(function(i, el) {
                var $el = $(el),
                    $original = $originals.eq(i),
                    s = Snap(el.querySelector('svg')),
                    path = s.select('path'),
                    pathConfig = {
                        from: $original.find('svg path').attr('d'),
                        to: $original.attr('data-path-hover')
                    };

                $el
                    .off('mouseenter.touchHoversMouseEnter')
                    .on('mouseenter.touchHoversMouseEnter', function() {
                        path.animate({
                            'path': pathConfig.to
                        }, speed, easing);
                    });

                $el
                    .off('mouseleave.touchHoversMouseLeave')
                    .on('mouseleave.touchHoversMouseLeave', function() {
                        path.animate({
                            'path': pathConfig.from
                        }, speed, easing);
                    });
            });
        }

        function unbindEvents() {
            $elements.each(function(i, el) {
                $(el)
                    .off('mouseenter.touchHoversMouseEnter')
                    .off('mouseleave.touchHoversMouseLeave');
            });
        }

        function showEffects() {
            $elements.each(function(i, el) {
                var $original = $originals.eq(i),
                    s = Snap(el.querySelector('svg')),
                    path = s.select('path'),
                    pathConfig = {
                        from: $original.find('svg path').attr('d'),
                        to: $original.attr('data-path-hover')
                    };
                path.animate({
                    'path': pathConfig.to
                }, speed, easing);
            });
        }

        function hideEffects() {
            $elements.each(function(i, el) {
                var $original = $originals.eq(i),
                    s = Snap(el.querySelector('svg')),
                    path = s.select('path'),
                    pathConfig = {
                        from: $original.find('svg path').attr('d'),
                        to: $original.attr('data-path-hover')
                    };
                path.animate({
                    'path': pathConfig.from
                }, speed, easing);
            });
        }

        return {
            init: init,
            bindEvents: bindEvents,
            unbindEvents: unbindEvents,
            showEffects: showEffects,
            hideEffects: hideEffects
        };
    })();

    touchHovers.init();

    jQuery('document').ready(function() {
        "use strict";

        if (isMobileBrowser()) {
            // its a mobile browser
            var $body = $('body');
            $body.removeClass("not-global-detect");
            $body.removeClass('global-mobile-off')
                 .addClass('global-mobile-on');
            touchHovers.showEffects();
            touchHovers.unbindEvents();
        } else {
            // its a desktop browser
            /*
            var $body = $('body');
            $body.removeClass('global-mobile-on')
                 .addClass('global-mobile-off');
            touchHovers.hideEffects();
            touchHovers.bindEvents();
            */
        }
    });

    /* ======= Animations ======= */
    jQuery('document').ready(function() {
        "use strict";
        
        //Only animate elements when using non-mobile devices
        if (isMobileBrowser() === false) {
            $(".inviewFade").each(function() {
                    $(this).css('opacity', 0).one('inview', function(isInView) {
                        if (isInView) {
                            $(this).addClass('animated fadeInUp delayp1');
                        }
                    });
                });
        }
    });

    // process the url hash section
    $(function(){
      if(window.location.hash) {
          // http://benalman.com/projects/jquery-bbq-plugin/
          var hashObj = $.deparam.fragment();

          if (hashObj) {
              // toggle on a modal if it matches a hash in the url
              var hashModal = hashObj.modal;
              if (hashModal) {
                  if ($("#modal-" + hashModal).length == 1) {
                      $("#modal-" + hashModal).modal('toggle');
                      // update all the other fields if it exists
                      for (var key in hashObj) {
                          if ($("#lba-" + hashModal + "-" + key).length == 1) {
                              $("#lba-" + hashModal + "-" + key).val(hashObj[key]);
                          }
                      }
                  }
              }
          }
      }
    });

    // initalize bootstrap validator for all the ones that have the matching class
    // http://bootstrapvalidator.com/getting-started/#example
    jQuery('document').ready(function() {
        "use strict";
        $(".lba-form-bv").each(function() {
            $("#" + this.id).bootstrapValidator();
        });
    });

    jQuery('document').ready(function() {
        "use strict";
        var getlocUrl = "https://lba-gae-services.appspot.com/getloc?callback=?"

        if (1 == $("#lba-survey-champion-demographic-v1").length) {
            var surveyElement = $("#lba-survey-champion-demographic-v1");
            $("<i/>", { class: "fa fa-cog fa-spin fa-2x", }).appendTo(surveyElement);

            $.getJSON(getlocUrl)
                .done(function(locData) {
                    buildSurveyDemographics(locData, lbaSurveyMeta, surveyElement);
                });
        } else if (1 == $("#lba-survey-champion-gaming-v1").length) {
            var surveyElement = $("#lba-survey-champion-gaming-v1");
            $("<i/>", { class: "fa fa-cog fa-spin fa-2x", }).appendTo(surveyElement);

            $.getJSON(getlocUrl)
                .done(function(locData) {
                    buildSurveyGaming(locData, lbaSurveyMeta, surveyElement);
                });
        } else if (1 == $("#lba-survey-champion-postsurvey-v1").length) {
            var surveyElement = $("#lba-survey-champion-postsurvey-v1");
            $("<i/>", { class: "fa fa-cog fa-spin fa-2x", }).appendTo(surveyElement);

            $.getJSON(getlocUrl)
                .done(function(locData) {
                    buildSurveyPost(locData, lbaSurveyMeta, surveyElement);
                });
        }
    });

})(jQuery);

function createSurveyRadioElement(radioName, radioValue, contentNode) {
    return  $("<div/>", { class:"radio"}).append(
                $("<label/>").append(
                    $("<input/>", { 
                        type: "radio",
                        name: radioName,
                        value: radioValue,
                    })
                ).append(contentNode)
            );
}

function buildSurveyDemographics(locJson, lbaSurveyMeta, surveyElement) {
    surveyConfig = {
        url: "https://docs.google.com/forms/d/1CWytPUm32PziFLVcusvubTzYcurpV6NOBUqEFsXklBc/formResponse",
        fields: [
            {fid:"gender",          gid:"entry.308725740",   special:"radio"},
            {fid:"age",             gid:"entry.1212857664",  special:"radio"},
            {fid:"employment",      gid:"entry.898972966",   special:"radio"},
            {fid:"findout",         gid:"entry.2055160845",  special:"radio"},
            {fid:"findother",       gid:"entry.1042000076"},
            {fid:"metaCourseSlug",  gid:"entry.399827778",   preset:lbaSurveyMeta.slug},
            {fid:"metaEmail",       gid:"entry.850294084",   preset:lbaSurveyMeta.email},
            {fid:"metaCity",        gid:"entry.1411920908",  preset:locJson.aeCity},
            {fid:"metaCountry",     gid:"entry.2104961038",  preset:locJson.aeCountry},
            {fid:"metaRegion",      gid:"entry.192813851",   preset:locJson.aeRegion},
            {fid:"metaCityLatLong", gid:"entry.216532533",   preset:locJson.aeCityLatLong},
            {fid:"metaLang",        gid:"entry.854120841",   preset:locJson.Lang},
            {fid:"metaIp",          gid:"entry.1510079047",  preset:locJson.clientIpAddr},
            {fid:"metaUserAgent",   gid:"entry.742353638",   preset:locJson.UserAgent},
        ],
    };
    var formId = "demography";
    var formWrapper = $("<div/>")
        .append(
            $("<div/>", { class:"formWrapper"})
                .append($("<div/>", { id: "lba-" + formId + "-sending", style: "display: none", })
                    .append($("<i/>", { class: "fa fa-spinner fa-spin fa-5x", })))
                .append($("<div/>", { id: "lba-" + formId + "-complete", style: "display: none", }).append("Survey Sent"))
                .append($("<div/>", { id: "lba-" + formId + "-error", style: "display: none", }).append("There was an error sending your survey."))
        );
    var lbaForm = $("<form/>", {
            id: "lba-" + formId,
            target: "_self",
            class: "lba-form-bv",
            action: "javascript:return false;",
            "data-bv-feedbackicons-valid": "glyphicon glyphicon-ok",
            "data-bv-feedbackicons-invalid": "glyphicon glyphicon-remove",
            "data-bv-feedbackicons-validating": "glyphicon glyphicon-refresh",
            "data-bv-submitbuttons": "#lba-" + formId + "-send",
        });
    {
        lbaForm.append(
            $("<div/>", { class:"form-group"})
                .append($("<label/>", { class:"control-label"}).append("What is your gender?"))
                .append(createSurveyRadioElement("lba-" + formId + "-gender", "Male", "Male"))
                .append(createSurveyRadioElement("lba-" + formId + "-gender", "Female", "Female"))
                .append(createSurveyRadioElement("lba-" + formId + "-gender", "no", "Prefer not to disclose"))
        );
    }
    {
        lbaForm.append(
            $("<div/>", { class:"form-group"})
                .append($("<label/>", { class:"control-label"}).append("What is your age group?"))
                .append(createSurveyRadioElement("lba-" + formId + "-age", "b17", "Below 17"))
                .append(createSurveyRadioElement("lba-" + formId + "-age", "18-23", "18-23"))
                .append(createSurveyRadioElement("lba-" + formId + "-age", "24-29", "24-29"))
                .append(createSurveyRadioElement("lba-" + formId + "-age", "30-34", "30-34"))
                .append(createSurveyRadioElement("lba-" + formId + "-age", "36-40", "36-40"))
                .append(createSurveyRadioElement("lba-" + formId + "-age", "a40", "Above 40"))
        );
    }
    {
        lbaForm.append(
            $("<div/>", { class:"form-group"})
                .append($("<label/>", { class:"control-label"}).append("What is your employment status?"))
                .append(createSurveyRadioElement("lba-" + formId + "-employment", "full-time", "Full-Time"))
                .append(createSurveyRadioElement("lba-" + formId + "-employment", "part-time", "Part-Time"))
                .append(createSurveyRadioElement("lba-" + formId + "-employment", "self-employed", "Self-Employed"))
                .append(createSurveyRadioElement("lba-" + formId + "-employment", "student", "Student"))
                .append(createSurveyRadioElement("lba-" + formId + "-employment", "not-employed", "Not-Employed"))
        );
    }
    {
        lbaForm.append(
            $("<div/>", { class:"form-group"})
                .append($("<label/>", { class:"control-label"}).append("How did you find out about this course?"))
                .append(createSurveyRadioElement("lba-" + formId + "-findout", "media", "Newspapers / TV"))
                .append(createSurveyRadioElement("lba-" + formId + "-findout", "social", "Social Media"))
                .append(createSurveyRadioElement("lba-" + formId + "-findout", "event", "Local Event"))
                .append(createSurveyRadioElement("lba-" + formId + "-findout", "in-game", "In Game Chat"))
                .append(createSurveyRadioElement("lba-" + formId + "-findout", "other", 
                    $("<input/>", { 
                            id: "lba-" + formId + "-findother",
                            name: "lba-" + formId + "-findother",
                            placeholder: "Other",
                            type: "text",
                            class: "form-control",
                            "data-bv-notempty": false,
                            "data-bv-stringlength": false,
                            maxlength: 50,
                        })))
        );
    }
    {
        lbaForm.append(
            $("<p/>", { class: "form-submit" }).append(
                $("<input/>", {
                    name: "submit",
                    type: "submit",
                    class: "btn btn-primary",
                    id: "lba-" + formId + "-send",
                    value: "Submit",
                    onclick: "javascript:postGForm('lba-" + formId + "', surveyConfig)",
                  })
            )
        );
    }
    formWrapper.append(lbaForm);
    surveyElement.empty();
    surveyElement.append(formWrapper);
    
    // enable the validation
    lbaForm.bootstrapValidator();
}

function buildSurveyGaming(locJson, lbaSurveyMeta, surveyElement) {
    surveyConfig = {
        url: "https://docs.google.com/forms/d/1ncLqMn_9UWzVexTLVqbaRMrTMrt2ga0eUYFMHKYhq_s/formResponse",
        fields: [
            {fid:"whyCourse",       gid:"entry.2042320457",  special:"radio"},
            {fid:"oftenThisChamp",  gid:"entry.519424920",   special:"radio"},
            {fid:"interestInChamp", gid:"entry.1424668934",  special:"radio"},
            {fid:"interestOther",   gid:"entry.1424668934"},
            {fid:"proPlay",         gid:"entry.671698211",   special:"radio"},
            {fid:"availForCourse",  gid:"entry.1826865261",  special:"radio"},
            {fid:"publicSummoner",  gid:"entry.1203515277"},
            {fid:"metaCourseSlug",  gid:"entry.864466051",   preset:lbaSurveyMeta.slug},
            {fid:"metaEmail",       gid:"entry.1686460020",  preset:lbaSurveyMeta.email},
            {fid:"metaCity",        gid:"entry.1516175357",  preset:locJson.aeCity},
            {fid:"metaCountry",     gid:"entry.1354129822",  preset:locJson.aeCountry},
            {fid:"metaRegion",      gid:"entry.491123207",   preset:locJson.aeRegion},
            {fid:"metaCityLatLong", gid:"entry.2114632599",  preset:locJson.aeCityLatLong},
            {fid:"metaLang",        gid:"entry.2032924212",  preset:locJson.Lang},
            {fid:"metaIp",          gid:"entry.1984793658",  preset:locJson.clientIpAddr},
            {fid:"metaUserAgent",   gid:"entry.306052337",   preset:locJson.UserAgent},
        ],
    };
    var formId = "gaming";
    var formWrapper = $("<div/>")
        .append(
            $("<div/>", { class:"formWrapper"})
                .append($("<div/>", { id: "lba-" + formId + "-sending", style: "display: none", })
                    .append($("<i/>", { class: "fa fa-spinner fa-spin fa-5x", })))
                .append($("<div/>", { id: "lba-" + formId + "-complete", style: "display: none", }).append("Survey Sent"))
                .append($("<div/>", { id: "lba-" + formId + "-error", style: "display: none", }).append("There was an error sending your survey."))
        );
    var lbaForm = $("<form/>", {
            id: "lba-" + formId,
            target: "_self",
            class: "lba-form-bv",
            action: "javascript:return false;",
            "data-bv-feedbackicons-valid": "glyphicon glyphicon-ok",
            "data-bv-feedbackicons-invalid": "glyphicon glyphicon-remove",
            "data-bv-feedbackicons-validating": "glyphicon glyphicon-refresh",
            "data-bv-submitbuttons": "#lba-" + formId + "-send",
        });
    {
        lbaForm.append(
            $("<div/>", { class:"form-group"})
                .append($("<label/>", { class:"control-label"}).append("Are you in a League of Legends Team? Why are you taking the course?"))
                .append(createSurveyRadioElement("lba-" + formId + "-whyCourse", "team, specialize", "part of a team, I intend on specializing with this champion"))
                .append(createSurveyRadioElement("lba-" + formId + "-whyCourse", "team, overview", "part of a team, everyone on the team is looking for an overview of this champion"))
                .append(createSurveyRadioElement("lba-" + formId + "-whyCourse", "no-team, specialize", "not currently in a team, planning on specializing with this champion in solo queue"))
                .append(createSurveyRadioElement("lba-" + formId + "-whyCourse", "no-team, curious", "not currently in a team, just for personal curiosity"))
        );
    }
    {
        lbaForm.append(
            $("<div/>", { class:"form-group"})
                .append($("<label/>", { class:"control-label"}).append("How many games have you played with this champion in the past month before the course?"))
                .append(createSurveyRadioElement("lba-" + formId + "-oftenThisChamp", "b3", "less than 3 games"))
                .append(createSurveyRadioElement("lba-" + formId + "-oftenThisChamp", "3-10", "3-10 games"))
                .append(createSurveyRadioElement("lba-" + formId + "-oftenThisChamp", "a10", "more than 10 games"))
        );
    }
    {
        lbaForm.append(
            $("<div/>", { class:"form-group"})
                .append($("<label/>", { class:"control-label"}).append("What best describes your interest in this champion?"))
                .append(createSurveyRadioElement("lba-" + formId + "-interestInChamp", "art", "like the champion game art"))
                .append(createSurveyRadioElement("lba-" + formId + "-interestInChamp", "friend", "recommended by a friend"))
                .append(createSurveyRadioElement("lba-" + formId + "-interestInChamp", "self", "new to this champion, want to play better myself"))
                .append(createSurveyRadioElement("lba-" + formId + "-interestInChamp", "pov", "experienced with this champion, looking for other points of views"))
                .append(createSurveyRadioElement("lba-" + formId + "-interestInChamp", "counter", "learn how to better counter play this champion"))
                .append(createSurveyRadioElement("lba-" + formId + "-interestInChamp", "other",
                    $("<input/>", { 
                            id: "lba-" + formId + "-interestOther",
                            name: "lba-" + formId + "-interestOther",
                            placeholder: "Other",
                            type: "text",
                            class: "form-control",
                            "data-bv-notempty": false,
                            "data-bv-stringlength": false,
                            maxlength: 140,
                        })))
        );
    }
    {
        lbaForm.append(
            $("<div/>", { class:"form-group"})
                .append($("<label/>", { class:"control-label"}).append("Have you played or plan to play League of Legends in a professional manner?"))
                .append(createSurveyRadioElement("lba-" + formId + "-proPlay", "yes", "yes"))
                .append(createSurveyRadioElement("lba-" + formId + "-proPlay", "planning", "planning to"))
                .append(createSurveyRadioElement("lba-" + formId + "-proPlay", "no", "no, just want to play casually"))
        );
    }
    {
        lbaForm.append(
            $("<div/>", { class:"form-group"})
                .append($("<label/>", { class:"control-label"}).append("How much time do you have available per week to take League of Legends online courses?"))
                .append(createSurveyRadioElement("lba-" + formId + "-availForCourse", "b1", "less than 1 hour"))
                .append(createSurveyRadioElement("lba-" + formId + "-availForCourse", "1-2", "1-2 hours"))
                .append(createSurveyRadioElement("lba-" + formId + "-availForCourse", "a2", "more than 2 hours"))
        );
    }
    {
        lbaForm.append(
            $("<div/>", { class:"form-group"})
                .append($("<label/>", { class:"control-label"}).append("If you are interested in improving future learning modules, you can optionally submit your public summoner name for performance tracking?"))
                .append($("<input/>", { 
                            id: "lba-" + formId + "-publicSummoner",
                            name: "lba-" + formId + "-publicSummoner",
                            placeholder: "public summoner name",
                            type: "text",
                            class: "form-control",
                            "data-bv-notempty": false,
                            "data-bv-stringlength": false,
                            maxlength: 30,
                        }))
        );
    }
    {
        lbaForm.append(
            $("<p/>", { class: "form-submit" }).append(
                $("<input/>", {
                    name: "submit",
                    type: "submit",
                    class: "btn btn-primary",
                    id: "lba-" + formId + "-send",
                    value: "Submit",
                    onclick: "javascript:postGForm('lba-" + formId + "', surveyConfig)",
                  })
            )
        );
    }
    formWrapper.append(lbaForm);
    surveyElement.empty();
    surveyElement.append(formWrapper);
    
    // enable the validation
    lbaForm.bootstrapValidator();
}

function buildSurveyPost(locJson, lbaSurveyMeta, surveyElement) {
    surveyConfig = {
        url: "https://docs.google.com/forms/d/1MRBH6ffA9nVmt58GkCyWgutetxLoZcftgObjq9LNvVo/formResponse",
        fields: [
            {fid:"time2Complete",   gid:"entry.216007560",   special:"radio"},
            {fid:"enoughMaterial",  gid:"entry.1207868816",  special:"radio"},
            {fid:"playStyleDiff",   gid:"entry.340473744",   special:"radio"},
            {fid:"playStyleOther",  gid:"entry.949908840"},
            {fid:"submitYoutube",   gid:"entry.902503239"},
            {fid:"nextTopic",       gid:"entry.2099473452"},
            {fid:"metaCourseSlug",  gid:"entry.1960061585",  preset:lbaSurveyMeta.slug},
            {fid:"metaEmail",       gid:"entry.1181969748",  preset:lbaSurveyMeta.email},
            {fid:"metaCity",        gid:"entry.1499493825",  preset:locJson.aeCity},
            {fid:"metaCountry",     gid:"entry.1028022339",  preset:locJson.aeCountry},
            {fid:"metaRegion",      gid:"entry.2127941192",  preset:locJson.aeRegion},
            {fid:"metaCityLatLong", gid:"entry.1420990632",  preset:locJson.aeCityLatLong},
            {fid:"metaLang",        gid:"entry.843984724",   preset:locJson.Lang},
            {fid:"metaIp",          gid:"entry.196959886",   preset:locJson.clientIpAddr},
            {fid:"metaUserAgent",   gid:"entry.769190035",   preset:locJson.UserAgent},
        ],
    };
    var formId = "postsurvey";
    var formWrapper = $("<div/>")
        .append(
            $("<div/>", { class:"formWrapper"})
                .append($("<div/>", { id: "lba-" + formId + "-sending", style: "display: none", })
                    .append($("<i/>", { class: "fa fa-spinner fa-spin fa-5x", })))
                .append($("<div/>", { id: "lba-" + formId + "-complete", style: "display: none", }).append("Survey Sent"))
                .append($("<div/>", { id: "lba-" + formId + "-error", style: "display: none", }).append("There was an error sending your survey."))
        );
    var lbaForm = $("<form/>", {
            id: "lba-" + formId,
            target: "_self",
            class: "lba-form-bv",
            action: "javascript:return false;",
            "data-bv-feedbackicons-valid": "glyphicon glyphicon-ok",
            "data-bv-feedbackicons-invalid": "glyphicon glyphicon-remove",
            "data-bv-feedbackicons-validating": "glyphicon glyphicon-refresh",
            "data-bv-submitbuttons": "#lba-" + formId + "-send",
        });
    {
        lbaForm.append(
            $("<div/>", { class:"form-group"})
                .append($("<label/>", { class:"control-label"}).append("How long did it take to complete the learning module?"))
                .append(createSurveyRadioElement("lba-" + formId + "-time2Complete", "hours", "Less than a day"))
                .append(createSurveyRadioElement("lba-" + formId + "-time2Complete", "days, overview", "A few days"))
                .append(createSurveyRadioElement("lba-" + formId + "-time2Complete", "weeks", "More than a week"))
        );
    }
    {
        lbaForm.append(
            $("<div/>", { class:"form-group"})
                .append($("<label/>", { class:"control-label"}).append("Was there enough appropriate material to learn something new?"))
                .append(createSurveyRadioElement("lba-" + formId + "-enoughMaterial", "much", "yes, too much material"))
                .append(createSurveyRadioElement("lba-" + formId + "-enoughMaterial", "enough", "yes, just enough"))
                .append(createSurveyRadioElement("lba-" + formId + "-enoughMaterial", "no", "no, not enough"))
        );
    }
    {
        lbaForm.append(
            $("<div/>", { class:"form-group"})
                .append($("<label/>", { class:"control-label"}).append("How do you significantly play differently from these case studies?"))
                .append(createSurveyRadioElement("lba-" + formId + "-playStyleDiff", "art", "I usually play this champion in different lane"))
                .append(createSurveyRadioElement("lba-" + formId + "-playStyleDiff", "friend", "I usually play this champion as a different role"))
                .append(createSurveyRadioElement("lba-" + formId + "-playStyleDiff", "self", "my early game creep score is vastly different"))
                .append(createSurveyRadioElement("lba-" + formId + "-playStyleDiff", "pov", "I have a different system in communicating with teammates"))
                .append(createSurveyRadioElement("lba-" + formId + "-playStyleDiff", "counter", "I usually pick very different late game items"))
                .append(createSurveyRadioElement("lba-" + formId + "-playStyleDiff", "other",
                    $("<input/>", { 
                            id: "lba-" + formId + "-playStyleOther",
                            name: "lba-" + formId + "-playStyleOther",
                            placeholder: "Other",
                            type: "text",
                            class: "form-control",
                            "data-bv-notempty": false,
                            "data-bv-stringlength": false,
                            maxlength: 50,
                        })))
        );
    }
    {
        lbaForm.append(
            $("<div/>", { class:"form-group"})
                .append($("<label/>", { class:"control-label"}).append("Do you have a youtube video you would like to submit for a future iteration of the course?"))
                .append($("<input/>", { 
                            id: "lba-" + formId + "-submitYoutube",
                            name: "lba-" + formId + "-submitYoutube",
                            placeholder: "video link",
                            type: "text",
                            class: "form-control",
                            "data-bv-notempty": false,
                            "data-bv-stringlength": false,
                            maxlength: 100,
                        })) 
        );
    }
    {
        lbaForm.append(
            $("<div/>", { class:"form-group"})
                .append($("<label/>", { class:"control-label"}).append("What topic or champion are you most interest in learning next?"))
                .append($("<input/>", { 
                            id: "lba-" + formId + "-nextTopic",
                            name: "lba-" + formId + "-nextTopic",
                            placeholder: "topic or champion",
                            type: "text",
                            class: "form-control",
                            "data-bv-notempty": false,
                            "data-bv-stringlength": false,
                            maxlength: 50,
                        }))
        );
    }
    {
        lbaForm.append(
            $("<p/>", { class: "form-submit" }).append(
                $("<input/>", {
                    name: "submit",
                    type: "submit",
                    class: "btn btn-primary",
                    id: "lba-" + formId + "-send",
                    value: "Submit",
                    onclick: "javascript:postGForm('lba-" + formId + "', surveyConfig)",
                  })
            )
        );
    }
    formWrapper.append(lbaForm);
    surveyElement.empty();
    surveyElement.append(formWrapper);
    
    // enable the validation
    lbaForm.bootstrapValidator();
}