function __Error__ (status, message) {
		var err = new Error(message);
		err.status = status;
		return err;
}

module.exports = __Error__;
