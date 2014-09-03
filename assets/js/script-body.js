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

})(jQuery);
