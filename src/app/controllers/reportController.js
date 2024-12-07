const ReportDAO = require('../dao/ReportDAO');
const PostDAO = require('../dao/PostDAO');
const Report = require('../models/Report');
const NotificationService = require('../services/NotificationService');
const NotificationInteraction = require('../constants/NotificationInteraction');

const getAllReports = async(req, res) => {
    try {
        const reports = await ReportDAO.getAllReports();
        const reportsLabel = `${reports.length} bejelentés nincs elkönyvelve`;
        const reportsTitle = reports.length > 0 ? `Bejelentések: (${reports.length})` : `Bejelentések`;

        // bejelentésekre mutató ejs path-ét ide bele kell majd írni
        // front-end részről kell a credentials a lekérésnél hogy a JWT tokent kinyerje (mint pl. notifications.ejs-nél)
        res.render('../pages/reports', {
            title: reportsTitle,
            reports,
            reportsLabel
        });
    } catch(error) {
        res.status(500).json({ message: 'Hiba történt a bejelentések lekérése során!' });
    }
}

const handleReport = async(req, res) => {
    try {
        // front-end résznél reportId-t, state-t és moderatorReply-t kell elküldeni a body-ban
        // state egy boolean hogy törli-e a moderátor a bejelentés-hez kötött tartalmat vagy mellőzi a bejelentést
        // a moderatorReply pedig a moderátor válasza a bejelentésre ez csak az értesítéshez kell
        const { reportId, state, moderatorReply } = req.body;
        const selectedReport = await ReportDAO.getReportById(reportId);
        const notificationTitle = "Felülvizsgálták a bejelentésed!";
        let notificationDescription;
        if(state) {
            let contentDeleted = await PostDAO.deletePostByAdmin(selectedReport.bejegyzes_id);
            /*
            if(selectedReport.hozzaszolas_id === null) {
                // ha bejegyzés van jelentve
                // contentDeleted = await PostDAO.deletePost(selectedReport.hozzaszolas_id);
                notificationDescription = `Az általad bejelentett bejegyzést egy moderátor törölte.`;
            } else if(selectedReport.bejegyzes_id === null) {
                // ha hozzászólás van jelentve
                // contentDeleted = await PostDAO.deleteComment(selectedReport.hozzaszolas_id);
                notificationDescription = `Az általad bejelentett hozzászólást egy moderátor törölte.`;
            }
            */
            if(!contentDeleted) {
                res.status(500).json({ message: 'Hiba történt a tartalom eltávolítása során!' });
            }
        } else {
            notificationDescription = `Az általad bejelentett tartalom nem került törlésre.`;
        }
        if(moderatorReply.length > 0) {
            notificationDescription += `\nA moderátor válasza: ${moderatorReply}`;
        }
        NotificationService.pushNotification(
            selectedReport.felhasznalo_id,
            notificationTitle,
            notificationDescription,
            NotificationInteraction.UNDEFINED,
            null,
            "../../public/images/warning.png" // statikus warning.png kép fog megjelenni a felhasználónak, nem vagyok benne biztos hogy jó-e a path
        );
        const reportDeleted = ReportDAO.deleteReportById(reportId);
        if(reportDeleted) {
            res.status(200).json({ message: 'Bejelentés törölve!' });
        } else {
            res.status(404).json({ message: 'Bejelentés nem található!' });
        }

    } catch(error) {
        res.status(500).json({ message: 'Hiba történt a bejelentés kezelése során! ' + error.toString() });
    }
}

const addReport = async(req, res) => {
    try {
        // front-end részről kérésben a body-ban az alábbiakat kell elküldeni:
        // userId: felhasználó id-je (pl. adott bejegyzés/hozzászólás objektumból kinyerve)
        // description: bejelentés szövege
        // attachedTo: string, értéke "post" vagy "comment" lehet csak ellenkező esetben nem működik
        // attachmentId: bejegyzés vagy hozzászólás id-je, attól függően hogy mit jelent be a felhasználó, melyik front-end elemmel interaktál

        const { userId, description, attachedTo, attachmentId } = req.body;
        const addedReport = await ReportDAO.create(userId, description, attachedTo, attachmentId);

        // TODO: moderátoroknak push-értesítés ha új bejelentés jön (?)
        NotificationService.pushNotification(
            userId,
            "Bejelentésed rögzítve!",
            description,
            NotificationInteraction.UNDEFINED,
            null,
            "../../public/images/warning.png"
        );
    } catch(error) {
        res.status(500).json({ message: 'Hiba történt a bejelentés hozzáadása során!' });
    }
}

module.exports = {
    getAllReports,
    handleReport,
    addReport
};