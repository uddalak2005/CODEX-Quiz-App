function verifyAdmin(req, res, next) {
    if (req.user.role == "admin") {
        next();
    } else {
        return res.status(401).json({
            message: "Unauthorised"
        })
    }
}

export default verifyAdmin;