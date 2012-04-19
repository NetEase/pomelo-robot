/**
 * node abstract for agent node
 * 
 */
Node.prototype.render = function() {
  var n = this;
  this._dom = $("#node_template").clone()
  .find(".node").html(n.nodeId + '[' +n.iport+ ']').end()
    .attr("id", "node_" + n.nodeId)
    .data('label', n.nodeId);
  // alert(this._dom.html());
  // Add to control panel in alphabetical order
  if (!$("#controls2 .node").length || n.nodeId > $("#controls2 .group:last").data('label')) {
    $("#controls2").append(n._dom);
  } else if (n.label < $("#controls2 .group:first").data('label')) {
    $("#controls2").prepend(n._dom);
  } else {
    $("#controls2 .group").each(function() {
      if (n.label < $(this).next().data('label') && n.nodeId > $(this).data('label')) {
        $(this).after(n._dom);
        return false;
      }
    });
  }
};

Node.prototype.destroy = function() {
  this._dom.remove();
};

 
