import ExpoModulesCore
import PDFKit

public class PdfTextExtractorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PdfTextExtractor")

    AsyncFunction("extractText") { (uri: URL) throws -> [[String: Any]] in
      guard let document = PDFDocument(url: uri) else {
        throw Exception(name: "PDF_READ_FAILED", description: "Unable to open PDF at \(uri.absoluteString)")
      }

      return (0..<document.pageCount).compactMap { index in
        guard let page = document.page(at: index) else {
          return nil
        }

        return [
          "pageNumber": index + 1,
          "text": page.string ?? ""
        ]
      }
    }
  }
}
