// Generated by CoffeeScript 1.4.0
(function() {

  $(document).ready(function() {
    var $_t, previewParClosedHeight;
    $_t = this;
    previewParClosedHeight = 25;
    jQuery("div.toggle.active > p").addClass("preview-active");
    jQuery("div.toggle.active > div.toggle-content").slideDown(400);
    return jQuery("div.toggle > label").click(function(e) {
      var isAccordion, parentSection, parentWrapper, previewPar, previewParAnimateHeight, previewParCurrentHeight, toggleContent;
      parentSection = jQuery(this).parent();
      parentWrapper = jQuery(this).parents("div.toogle");
      previewPar = false;
      isAccordion = parentWrapper.hasClass("toogle-accordion");
      if (isAccordion && typeof e.originalEvent !== "undefined") {
        parentWrapper.find("div.toggle.active > label").trigger("click");
      }
      parentSection.toggleClass("active");
      if (parentSection.find("> p").get(0)) {
        previewPar = parentSection.find("> p");
        previewParCurrentHeight = previewPar.css("height");
        previewParAnimateHeight = previewPar.css("height");
        previewPar.css("height", "auto");
        previewPar.css("height", previewParCurrentHeight);
      }
      toggleContent = parentSection.find("> div.toggle-content");
      if (parentSection.hasClass("active")) {
        jQuery(previewPar).animate({
          height: previewParAnimateHeight
        }, 350, function() {
          return jQuery(this).addClass("preview-active");
        });
        return toggleContent.slideDown(350);
      } else {
        jQuery(previewPar).animate({
          height: previewParClosedHeight
        }, 350, function() {
          return jQuery(this).removeClass("preview-active");
        });
        return toggleContent.slideUp(350);
      }
    });
  });

}).call(this);