package expo.modules.pdftextextractor

import android.net.Uri
import com.tom_roush.pdfbox.android.PDFBoxResourceLoader
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.text.PDFTextStripper
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class PdfTextExtractorModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PdfTextExtractor")

    AsyncFunction("extractText") { uri: String ->
      val context = requireNotNull(appContext.reactContext) {
        "React application context is unavailable"
      }
      val file = resolvePdfFile(uri)
      PDFBoxResourceLoader.init(context.applicationContext)

      PDDocument.load(file).use { document ->
        val stripper = PDFTextStripper()

        (1..document.numberOfPages).map { pageNumber ->
          stripper.startPage = pageNumber
          stripper.endPage = pageNumber

          mapOf(
            "pageNumber" to pageNumber,
            "text" to stripper.getText(document).trim()
          )
        }
      }
    }
  }

  private fun resolvePdfFile(uri: String): File {
    val parsed = Uri.parse(uri)
    val path = parsed.path ?: throw IllegalArgumentException("Unable to resolve PDF path for $uri")
    return File(path)
  }
}
