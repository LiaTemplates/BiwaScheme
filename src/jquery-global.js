// BiwaScheme's DOM functions (getelem, element-*, set-content!, …) read
// window.jQuery once while the module loads, so it must be set first.
import jQuery from 'jquery'

window.jQuery = jQuery
