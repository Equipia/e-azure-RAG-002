import { renderToStaticMarkup } from "react-dom/server";
import { ChatAppResponse, getCitationFilePath } from "../../api";
import { getOriginalPage } from "../../api/pdfPageMapping";

type HtmlParsedAnswer = {
    answerHtml: string;
    citations: string[];
};

export function parseAnswerToHtml(answer: ChatAppResponse, isStreaming: boolean, onCitationClicked: (citationFilePath: string) => void): HtmlParsedAnswer {
    const possibleCitations = answer.context.data_points.citations || [];
    const citations: string[] = [];

    // Trim any whitespace from the end of the answer after removing follow-up questions
    let parsedAnswer = answer.message.content.trim();

    // Omit a citation that is still being typed during streaming
    if (isStreaming) {
        let lastIndex = parsedAnswer.length;
        for (let i = parsedAnswer.length - 1; i >= 0; i--) {
            if (parsedAnswer[i] === "]") {
                break;
            } else if (parsedAnswer[i] === "[") {
                lastIndex = i;
                break;
            }
        }
        const truncatedAnswer = parsedAnswer.substring(0, lastIndex);
        parsedAnswer = truncatedAnswer;
    }

    const parts = parsedAnswer.split(/\[([^\]]+)\]/g);

    const fragments: string[] = parts.map((part, index) => {
        if (index % 2 === 0) {
            return part;
        } else {
            let citationIndex: number;

            const isValidCitation = possibleCitations.some(citation => {
                return citation.startsWith(part);
            });

            if (!isValidCitation) {
                return `[${part}]`;
            }

            if (citations.indexOf(part) !== -1) {
                citationIndex = citations.indexOf(part) + 1;
            } else {
                citations.push(part);
                citationIndex = citations.length;
            }

            const path = getCitationFilePath(part);

            // Try to extract part file and page number from citation string
            let pageSuffix = "";
            const match = part.match(/(z8000-18-part\d+\.pdf)#page=(\d+)/);
            if (match) {
                const [, partFile, pageStr] = match;
                const pageNum = parseInt(pageStr, 10);
                const origPage = getOriginalPage(partFile, pageNum);
                if (origPage) {
                    pageSuffix = ` (Page ${origPage})`;
                }
            }

            return renderToStaticMarkup(
                <a className="supContainer" title={part + pageSuffix} onClick={() => onCitationClicked(path)}>
                    <sup>{citationIndex}</sup>
                    {pageSuffix}
                </a>
            );
        }
    });

    return {
        answerHtml: fragments.join(""),
        citations
    };
}
