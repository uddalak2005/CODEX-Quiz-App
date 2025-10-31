import jwt from "jsonwebtoken";

function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;

    const token = authHeader && authHeader.split(' ')[1];

    console.log(token);

    if (!token) {
        console.log("No Token");
        return res.status(401).json({
            message: "Unauthorised"
        })
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                message: "Forbidden"
            })
        }

        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
        }

        console.log("Auth Successfull");

        next();
    })

}

export default verifyJWT;