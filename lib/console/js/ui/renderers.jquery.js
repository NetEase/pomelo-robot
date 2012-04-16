/* Log.io web client renderers
 * Defines render() & destroy() methods for Node, Stream, History
 */

Node.prototype.render = function() {
  var n = this;
  this._dom = $("#node_template").clone()
    .find(".node").html(n.label).end()
    .attr("id", "node_" + n.label)
    .data('label', n.label);

  // Add to control panel in alphabetical order
  if (!$("#controls2 .node").length || n.label > $("#controls2 .group:last").data('label')) {
    $("#controls2").append(n._dom);
  } else if (n.label < $("#controls2 .group:first").data('label')) {
    $("#controls2").prepend(n._dom);
  } else {
    $("#controls2 .group").each(function() {
      if (n.label < $(this).next().data('label') && n.label > $(this).data('label')) {
        $(this).after(n._dom);
        return false;
      }
    });
  }
  
  // Render LogFiles
 // _(n.log_nodes).each(function(log_file, llabel) {
    //log_file.render();
  //});
};

Node.prototype.destroy = function() {
  this._dom.remove();
};

 
